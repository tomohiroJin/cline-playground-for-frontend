/**
 * `G2a`（コスト交絡の分離・軸だけの効果）の測定（設計書 §8.2.12）
 *
 * **これは測定であって合否判定ではない。閾値の assert を置かない。**
 * 数値は §8.2.12(h) の演算で人が判定する。
 *
 * `G1''`（§8.2.10・§8.2.11）は Pass したが、比較した2つの腕は
 * **軸適合とコストが同時に反転していた**（`demandAwareAcquire` は軸降順・
 * コスト昇順＝最安、`worstDemandAcquire` は軸昇順・コスト降順＝最高）。
 * したがって観測された差が「軸に合う札だから」なのか「安い札だから」なのか
 * 区別できていなかった（§8.2.11 反対解釈1）。
 *
 * **今回は軸だけを反転させた腕 `axisWorstAcquire` で測り直す。**
 * コストの同点処理は両腕とも「最安」で揃っているので、`demandAwareAcquire` 対
 * `axisWorstAcquire` の差は**軸適合の効果だけ**を表す（§8.2.12(b)）。
 *
 * `G2b`（コストだけの分離）はこの事前登録に含めない。使える組の見込みが
 * 桁違いに少なく（パイロット実測 24.5%）、必要試行数が2,041 に達するため、
 * `G2a` と混ぜると underpowered な測定が紛れ込む（§8.2.12(e)）。
 *
 * この測定の対比は `G2a` の1本だけである。`G1a`（`ablated`・「札を1枚多く
 * 持つこと」自体の機構）はこの事前登録の範囲外であり、**集計しない**。
 *
 * **除外（最良と最悪が同一の提示、`swapped === undefined`）の扱いに注意。**
 * 除外された組では `swapped` 腕がそもそも存在しない。過去の測定
 * （`expedition-gate-redo.manual.test.ts`）は主要対比が使わない別腕
 * （`ablated`）を代わりに数え、それを「向きの内訳」として報告する誤りを犯した
 * （§8.2.11 で訂正済み）。**この測定では `ablated` を一切使わない。**
 * 主要対比 `G2a` について、除外は**定義上** `b`・`c` に寄与しえない
 * ——両腕が同じ札を取るのだから2つのランは完全に同一になり、必ず一致セルに
 * 入るからである。したがって「向きを測って0対0でした」とは書かず、
 * 「定義上ゼロである」と明記したうえで除外数だけを報告する。
 *
 * CI には常駐させない。実行するには:
 *   ASHEN_RAMPART_G2=1 npx jest axis-effect-gate --silent=false
 */
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { mcnemarExactP } from '../../domain/shared/mcnemar';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import { demandAwareAcquire, type ExpeditionSimulationResult } from './expedition-simulation';
import { axisWorstAcquire, runCounterfactual, type CounterfactualPair } from './counterfactual';

/**
 * シード帯 821〜1250（§8.2.12(f)。プリセットごとに430試行、計860）。
 * 821 未満は `G1''`（251〜620）と直近のパイロット（621〜820）で既使用のため使わない。
 *
 * **開始値 821 は事前登録された値であり固定する。**
 * `ASHEN_RAMPART_G2_SEED_END` は**動作確認専用の縮小口**である
 * （終了値だけを下げて短時間で出力の形を確認するために存在する）。
 * 判定に使う測定は必ず既定の終了値（1250）で実行すること。
 */
const SEED_START = 821;
const SEED_END = Number(process.env.ASHEN_RAMPART_G2_SEED_END ?? 1250);
const isEnabled = process.env.ASHEN_RAMPART_G2 === '1';

/** 提示が2回起きた遠征のみを母集団とする添字（§8.2.10(a)・§8.2.12(g)で流用） */
const POPULATION_LAST_OFFER_INDEX = 1;

interface Contingency {
  /** 両腕とも踏破 */
  bothCleared: number;
  /** 実ランのみ踏破 */
  actualOnly: number;
  /** 反実仮想（`axisWorstAcquire`）のみ踏破 */
  counterfactualOnly: number;
  /** 両腕とも失敗 */
  neitherCleared: number;
}

/** `pair.swapped`（`G2a` の反実仮想）が存在する組だけを対にして残す */
const toComparable = (
  pairs: readonly CounterfactualPair[]
): { actual: CounterfactualPair; counterfactual: ExpeditionSimulationResult }[] =>
  pairs.flatMap((pair) => (pair.swapped === undefined ? [] : [{ actual: pair, counterfactual: pair.swapped }]));

const tabulate = (pairs: readonly CounterfactualPair[]): Contingency => {
  const table: Contingency = {
    bothCleared: 0, actualOnly: 0, counterfactualOnly: 0, neitherCleared: 0,
  };
  toComparable(pairs).forEach(({ actual, counterfactual }) => {
    const a = actual.actual.outcome === 'cleared';
    const b = counterfactual.outcome === 'cleared';
    if (a && b) table.bothCleared++;
    else if (a) table.actualOnly++;
    else if (b) table.counterfactualOnly++;
    else table.neitherCleared++;
  });
  return table;
};

const describeTable = (label: string, pairs: readonly CounterfactualPair[]): string => {
  const table = tabulate(pairs);
  const comparable = toComparable(pairs);
  const discordant = table.actualOnly + table.counterfactualOnly;
  const p = mcnemarExactP(table.actualOnly, table.counterfactualOnly);
  const total = discordant + table.bothCleared + table.neitherCleared;

  // **補助指標（§8.2.6(c)・§8.2.12(g)で流用）**: stagesCleared の対応差
  // （実ラン − 反実仮想）の平均。主指標は cleared の二値に限定されているため
  // 判定には使わない――以下の見出しに明記する。
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
    `  → §8.2.12(h) の通過要件: p < 0.05 かつ b+c >= 25`,
    `  補助（判定に使わない）: stagesCleared の対応差 平均 ${sign}${stagesClearedDiffMean.toFixed(2)}`,
  ].join('\n');
};

(isEnabled ? describe : describe.skip)("G2a の測定（軸だけの効果）", () => {
  jest.setTimeout(1200000);

  it('主要対比 G2a（最後の提示で軸に合う札 対 軸だけ合わない札。コスト同点処理は両腕とも最安）', () => {
    const lines: string[] = [];
    const allPopulationPairs: CounterfactualPair[] = [];
    let allExcludedCount = 0;
    let totalTrials = 0;
    let totalOutOfPopulation = 0;
    let totalNotClean = 0;

    Object.values(PRESET_DECKS).forEach((preset) => {
      const populationPairs: CounterfactualPair[] = [];
      let excludedCount = 0;
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
          counterfactualAcquire: axisWorstAcquire,
        });

        // 母集団（§8.2.10(a)・§8.2.12(g)で流用）: 提示が2回起きた遠征のみ。
        if (pair.lastOfferIndex !== POPULATION_LAST_OFFER_INDEX) {
          outOfPopulation++;
          continue;
        }

        // `P5`（§8.2.10(e)）: 母集団内で isClean=false は0件のはず。発火は母集団定義の破れ。
        if (!pair.isClean) notClean++;

        // 除外（§8.2.10(b)・§8.2.12(g)で流用）: 最良の札と最悪の札が同一になる提示だけを除外する。
        // `G2a` について、除外は定義上 b・c に寄与しえない（下記サマリーの注記を参照）。
        if (pair.swapped === undefined) {
          excludedCount++;
          continue;
        }

        populationPairs.push(pair);
      }

      allPopulationPairs.push(...populationPairs);
      allExcludedCount += excludedCount;
      totalTrials += trials;
      totalOutOfPopulation += outOfPopulation;
      totalNotClean += notClean;

      lines.push(
        `===== プリセット ${preset.id}（層別・探索的） =====`,
        `  試行 ${trials} / 母集団 ${populationPairs.length + excludedCount}`
          + ` / 母集団外 ${outOfPopulation}`,
        `  除外（最良と最悪が同一） ${excludedCount}`
          + `（定義上 b・c に寄与しえない: 両腕が同じ札を取るため2つのランは完全に`
          + `同一になり、必ず一致セルに入る。実測ではなく定義から従う）`,
        `  P5（母集団内の isClean=false） ${notClean} 件（0件であるべき）`,
        describeTable(`${preset.id} G2a 主要対比`, populationPairs)
      );
    });

    const allPopulationCount = allPopulationPairs.length + allExcludedCount;

    lines.unshift(
      '########## 全体サマリー ##########',
      `  試行数 ${totalTrials}`,
      `  母集団に入った数 ${allPopulationCount} / 母集団外 ${totalOutOfPopulation}`,
      `  除外数 ${allExcludedCount}`
        + `（定義上 b・c に寄与しえない: 両腕が同じ札を取るため2つのランは完全に`
        + `同一になり、必ず一致セルに入る。実測ではなく定義から従う。`
        + ` ※ G1a は集計しないため ablated による代用は行わない）`,
      `  P5（母集団内の isClean=false・全体） ${totalNotClean} 件（0件であるべき）`,
      '',
      '########## G2a 主要対比（両プリセット合算・これが判定の対象） ##########',
      describeTable('G2a 合算', allPopulationPairs),
      ''
    );
    console.log(lines.join('\n'));

    // **閾値ではない構造的な検査**: 試行が1件も母集団に入らなければ、
    // 検出力の計算も P5 の検査もそもそも成立しない。ここが落ちたら、それ自体が
    // 発見である。assert を緩めずに報告すること（合否の閾値ではない）。
    expect(allPopulationPairs.length).toBeGreaterThan(0);
  });
});
