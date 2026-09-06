/**
 * `G1''`（ゲートやり直し・3回目）の測定（設計書 §8.2.10）
 *
 * **これは測定であって合否判定ではない。閾値の assert を置かない。**
 * 数値は §8.2.10(f) が指す §8.2.6(k) の判定票へ人が転記し、(h) の演算で判定する。
 *
 * `G1'` は2度判定不能になった（§8.2.9）。2度目の原因は**処置後の変数
 * （`isClean`＝再生で提示が増えていないか）で母集団を絞ったこと**である。
 * 提示が増えたこと自体が、測っている選択の結果だった
 * （別の札を取った → ステージ2 に勝てた → 提示が1回増えた）。
 * 除外は構造的に「反実仮想だけが踏破した組」しか削れず、これが判定を左右した。
 *
 * **今回は母集団を処置前の変数だけで定義する（§8.2.10(a)）:**
 * 「提示が2回起きた遠征」＝実ランがステージ1・2 の両方に勝った遠征だけを対象にする
 * （`pair.lastOfferIndex === 1`）。差し替える提示はステージ2 の後の1回に固定され、
 * その提示より後に提示は無いので、下流の乖離が原理的に起きない。
 * `isClean` はこの母集団の絞り込みには使わない（`P5` の検査にのみ使う）。
 *
 * CI には常駐させない（約6分かかる）。実行するには:
 *   ASHEN_RAMPART_G1=1 npx jest expedition-gate-redo --silent=false
 */
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { mcnemarExactP } from '../../domain/shared/mcnemar';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import { demandAwareAcquire, type ExpeditionSimulationResult } from './expedition-simulation';
import { runCounterfactual, type CounterfactualPair } from './counterfactual';

/**
 * シード帯 251〜620（§8.2.10(d)。プリセットごとに370試行、計740）。
 * §8.2.6(h) の「変更後は別のシード帯で測り直す」に従い、`G1'` が使った 1〜250 は使わない。
 *
 * **開始値 251 は事前登録された値であり固定する。**
 * `ASHEN_RAMPART_G1_SEED_END` は**動作確認専用の縮小口**である
 * （終了値だけを下げて短時間で出力の形を確認するために存在する）。
 * 判定に使う測定は必ず既定の終了値（620）で実行すること。
 */
const SEED_START = 251;
const SEED_END = Number(process.env.ASHEN_RAMPART_G1_SEED_END ?? 620);
const isEnabled = process.env.ASHEN_RAMPART_G1 === '1';

/** 提示が2回起きた遠征のみを母集団とする添字（§8.2.10(a)）。ステージ1・2 の両方に勝った遠征でのみ成立する */
const POPULATION_LAST_OFFER_INDEX = 1;

interface Contingency {
  /** 両腕とも踏破 */
  bothCleared: number;
  /** 実ランのみ踏破 */
  actualOnly: number;
  /** 反実仮想のみ踏破 */
  counterfactualOnly: number;
  /** 両腕とも失敗 */
  neitherCleared: number;
}

/** 除外した組の踏破方向の内訳（§8.2.10(c)）*/
interface ExclusionDirection {
  /** `actual` のみ踏破 */
  actualOnly: number;
  /** 反実仮想のみ踏破（`swapped` が無い除外なので `ablated` を代わりに数える） */
  counterfactualOnly: number;
  /** どちらも踏破していない、またはどちらも踏破している（向きが判定できない） */
  other: number;
}

const tabulate = (
  pairs: readonly CounterfactualPair[],
  pick: (pair: CounterfactualPair) => CounterfactualPair['ablated']
): Contingency => {
  const table: Contingency = {
    bothCleared: 0, actualOnly: 0, counterfactualOnly: 0, neitherCleared: 0,
  };
  pairs.forEach((pair) => {
    const other = pick(pair);
    if (!other) return;
    const a = pair.actual.outcome === 'cleared';
    const b = other.outcome === 'cleared';
    if (a && b) table.bothCleared++;
    else if (a) table.actualOnly++;
    else if (b) table.counterfactualOnly++;
    else table.neitherCleared++;
  });
  return table;
};

/** `pick` で比較可能な（反実仮想が存在する）組だけを、その反実仮想と対にして残す */
const toComparable = (
  pairs: readonly CounterfactualPair[],
  pick: (pair: CounterfactualPair) => CounterfactualPair['ablated']
): { actual: CounterfactualPair; counterfactual: ExpeditionSimulationResult }[] =>
  pairs.flatMap((pair) => {
    const counterfactual = pick(pair);
    return counterfactual === undefined ? [] : [{ actual: pair, counterfactual }];
  });

const describeTable = (
  label: string,
  pairs: readonly CounterfactualPair[],
  pick: (pair: CounterfactualPair) => CounterfactualPair['ablated']
): string => {
  const table = tabulate(pairs, pick);
  const comparable = toComparable(pairs, pick);
  const discordant = table.actualOnly + table.counterfactualOnly;
  const p = mcnemarExactP(table.actualOnly, table.counterfactualOnly);
  const total = discordant + table.bothCleared + table.neitherCleared;

  // **補助指標（§8.2.6(c)）**: stagesCleared の対応差（実ラン − 反実仮想）の平均。
  // 主指標は cleared の二値に限定されている（§8.2.6(c)）ため、
  // これは判定には使わない――以下の見出しに明記する。
  const stagesClearedDiffMean = comparable.length === 0
    ? 0
    : comparable.reduce(
      (sum, { actual, counterfactual }) => sum + (actual.actual.stagesCleared - counterfactual.stagesCleared),
      0
    ) / comparable.length;
  const sign = stagesClearedDiffMean >= 0 ? '+' : '';

  return [
    `--- ${label} ---`,
    `  母集団サイズ（判定に使う N） ${total}`,
    `  両方踏破 ${table.bothCleared} / 実ランのみ ${table.actualOnly}`
      + ` / 反実仮想のみ ${table.counterfactualOnly} / 両方失敗 ${table.neitherCleared}`,
    `  不一致 b+c = ${discordant}（${((discordant / Math.max(1, total)) * 100).toFixed(1)}%）`,
    `  McNemar 正確検定 両側 p = ${p.toFixed(6)}`,
    `  → §8.2.10(f) の通過要件: p < 0.05 かつ b+c >= 25`,
    `  補助（判定に使わない）: stagesCleared の対応差 平均 ${sign}${stagesClearedDiffMean.toFixed(2)}`,
  ].join('\n');
};

/**
 * 除外した組の踏破方向を数える（§8.2.10(c)）。
 *
 * 除外できるのは「最良の札と最悪の札が同一になる提示」（`pair.swapped === undefined`）
 * だけである。この除外では `swapped` 腕がそもそも存在しないため、`ablated` を
 * 代わりに「反実仮想側」として数える。**この代替であることをここに明記する。**
 * 前回（§8.2.9(g)）はこの内訳を数えず、論証だけで「中立」と書いて誤った。
 */
const tabulateExclusionDirection = (excluded: readonly CounterfactualPair[]): ExclusionDirection => {
  const direction: ExclusionDirection = { actualOnly: 0, counterfactualOnly: 0, other: 0 };
  excluded.forEach((pair) => {
    const actualCleared = pair.actual.outcome === 'cleared';
    const counterfactualCleared = pair.ablated?.outcome === 'cleared';
    if (actualCleared && !counterfactualCleared) direction.actualOnly++;
    else if (!actualCleared && counterfactualCleared) direction.counterfactualOnly++;
    else direction.other++;
  });
  return direction;
};

(isEnabled ? describe : describe.skip)("G1'' の測定", () => {
  jest.setTimeout(900000);

  it('主要対比 G1b（最後の提示で最良の札 対 最も合わない札）と探索的 G1a', () => {
    const lines: string[] = [];
    const allPopulationPairs: CounterfactualPair[] = [];
    const allExcludedPairs: CounterfactualPair[] = [];
    let totalTrials = 0;
    let totalOutOfPopulation = 0;
    let totalNotClean = 0;

    Object.values(PRESET_DECKS).forEach((preset) => {
      const populationPairs: CounterfactualPair[] = [];
      const excludedPairs: CounterfactualPair[] = [];
      let trials = 0;
      let outOfPopulation = 0;
      let notClean = 0;

      for (let seed = SEED_START; seed <= SEED_END; seed++) {
        trials++;
        const pair = runCounterfactual({
          initialDeck: preset.cards,
          seed,
          strategy: greedyStrategy,
          acquire: demandAwareAcquire,
          randomFactory: createSeededRandom,
        });

        // 母集団（§8.2.10(a)）: 提示が2回起きた遠征のみ。処置前の変数だけで決まる。
        if (pair.lastOfferIndex !== POPULATION_LAST_OFFER_INDEX) {
          outOfPopulation++;
          continue;
        }

        // `P5`（§8.2.10(e)）: 母集団内で isClean=false は0件のはず。発火は母集団定義の破れ。
        if (!pair.isClean) notClean++;

        // 除外（§8.2.10(b)）: 最良の札と最悪の札が同一になる提示だけを除外する。
        if (pair.swapped === undefined) {
          excludedPairs.push(pair);
          continue;
        }

        populationPairs.push(pair);
      }

      allPopulationPairs.push(...populationPairs);
      allExcludedPairs.push(...excludedPairs);
      totalTrials += trials;
      totalOutOfPopulation += outOfPopulation;
      totalNotClean += notClean;

      const exclusionDirection = tabulateExclusionDirection(excludedPairs);

      lines.push(
        `===== プリセット ${preset.id}（層別・探索的） =====`,
        `  試行 ${trials} / 母集団 ${populationPairs.length + excludedPairs.length}`
          + ` / 母集団外 ${outOfPopulation}`,
        `  除外（最良と最悪が同一） ${excludedPairs.length}`
          + `（うち actual のみ踏破 ${exclusionDirection.actualOnly}`
          + ` / 反実仮想のみ踏破 ${exclusionDirection.counterfactualOnly}`
          + ` ※反実仮想側は swapped が無いため ablated で代用`
          + ` / どちらでもない ${exclusionDirection.other}）`,
        `  P5（母集団内の isClean=false） ${notClean} 件（0件であるべき）`,
        describeTable(`${preset.id} G1b 主要対比`, populationPairs, (p) => p.swapped),
        describeTable(`${preset.id} G1a 探索的`, populationPairs, (p) => p.ablated),
      );
    });

    const allExclusionDirection = tabulateExclusionDirection(allExcludedPairs);
    const allPopulationCount = allPopulationPairs.length + allExcludedPairs.length;

    lines.unshift(
      '########## 全体サマリー ##########',
      `  試行数 ${totalTrials}`,
      `  母集団に入った数 ${allPopulationCount} / 母集団外 ${totalOutOfPopulation}`,
      `  除外数 ${allExcludedPairs.length}`
        + `（うち actual のみ踏破 ${allExclusionDirection.actualOnly}`
        + ` / 反実仮想のみ踏破 ${allExclusionDirection.counterfactualOnly}`
        + ` ※反実仮想側は swapped が無いため ablated で代用`
        + ` / どちらでもない ${allExclusionDirection.other}）`,
      `  P5（母集団内の isClean=false・全体） ${totalNotClean} 件（0件であるべき）`,
      '',
      '########## G1b 主要対比（両プリセット合算・これが判定の対象） ##########',
      describeTable('G1b 合算', allPopulationPairs, (p) => p.swapped),
      '########## G1a 機構（探索的・多重比較の補正なしに解釈しない） ##########',
      describeTable('G1a 合算', allPopulationPairs, (p) => p.ablated),
      ''
    );
    console.log(lines.join('\n'));

    // **閾値ではない構造的な検査**: 試行が1件も母集団に入らなければ、
    // 検出力の計算も P5 の検査もそもそも成立しない。ここが落ちたら、それ自体が
    // 発見である。assert を緩めずに報告すること（合否の閾値ではない）。
    expect(allPopulationPairs.length).toBeGreaterThan(0);
  });
});
