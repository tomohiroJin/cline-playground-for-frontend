/**
 * `G1'`（ゲートやり直し）の測定（設計書 §8.2.6）
 *
 * **これは測定であって合否判定ではない。閾値の assert を置かない。**
 * 数値は §8.2.6(k) の判定票へ人が転記し、(h) の演算で判定する。
 *
 * CI には常駐させない（§8.2.6(e)。約3〜5分かかる）。実行するには:
 *   ASHEN_RAMPART_G1=1 npx jest expedition-gate-redo --silent=false
 */
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { mcnemarExactP } from '../../domain/shared/mcnemar';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import { demandAwareAcquire } from './expedition-simulation';
import { runCounterfactual, type CounterfactualPair } from './counterfactual';

/**
 * 250シード × プリセット2種 = 500組（§8.2.6(e) の検出力計算による）
 *
 * `ASHEN_RAMPART_G1_SEEDS` は**動作確認専用の縮小口**である。
 * 事前登録した N を測定時に変えてはならない（§8.2.6 冒頭）。
 * 判定に使う測定は必ず既定値（250）で実行すること。
 */
const SEEDS = Number(process.env.ASHEN_RAMPART_G1_SEEDS ?? 250);
const isEnabled = process.env.ASHEN_RAMPART_G1 === '1';

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

const describeTable = (label: string, table: Contingency): string => {
  const discordant = table.actualOnly + table.counterfactualOnly;
  const p = mcnemarExactP(table.actualOnly, table.counterfactualOnly);
  const total = discordant + table.bothCleared + table.neitherCleared;
  return [
    `--- ${label} ---`,
    `  組数 ${total}`,
    `  両方踏破 ${table.bothCleared} / 実ランのみ ${table.actualOnly}`
      + ` / 反実仮想のみ ${table.counterfactualOnly} / 両方失敗 ${table.neitherCleared}`,
    `  不一致 b+c = ${discordant}（${((discordant / Math.max(1, total)) * 100).toFixed(1)}%）`,
    `  McNemar 正確検定 両側 p = ${p.toFixed(6)}`,
    `  → §8.2.6(f) の通過要件: p < 0.05 かつ b+c >= 25`,
  ].join('\n');
};

(isEnabled ? describe : describe.skip)("G1' の測定", () => {
  jest.setTimeout(900000);

  it('主要対比 G1b（最後の提示で最良の札 対 最も合わない札）と探索的 G1a', () => {
    const lines: string[] = [];
    const allPairs: CounterfactualPair[] = [];

    Object.values(PRESET_DECKS).forEach((preset) => {
      const pairs: CounterfactualPair[] = [];
      let excludedNotClean = 0;
      let excludedNoSwap = 0;

      for (let seed = 1; seed <= SEEDS; seed++) {
        const pair = runCounterfactual({
          initialDeck: preset.cards,
          seed,
          strategy: greedyStrategy,
          acquire: demandAwareAcquire,
          randomFactory: createSeededRandom,
        });
        if (!pair.isClean) { excludedNotClean++; continue; }
        if (pair.swapped === undefined) excludedNoSwap++;
        pairs.push(pair);
      }
      allPairs.push(...pairs);

      lines.push(
        `===== プリセット ${preset.id}（層別・探索的） =====`,
        `  試行 ${SEEDS} / 採用 ${pairs.length}`,
        `  除外: 交絡（isClean=false）${excludedNotClean}`
          + ` / 提示内で最良と最悪が同一 ${excludedNoSwap}`,
        describeTable(`${preset.id} G1b 主要対比`, tabulate(pairs, (p) => p.swapped)),
        describeTable(`${preset.id} G1a 探索的`, tabulate(pairs, (p) => p.ablated)),
      );
    });

    lines.unshift(
      '########## G1b 主要対比（両プリセット合算・これが判定の対象） ##########',
      describeTable('G1b 合算', tabulate(allPairs, (p) => p.swapped)),
      '########## G1a 機構（探索的・多重比較の補正なしに解釈しない） ##########',
      describeTable('G1a 合算', tabulate(allPairs, (p) => p.ablated)),
      '',
    );
    console.log(lines.join('\n'));

    // **閾値ではない構造的な検査**: 採用された組が事前登録の N=500 に対して
    // 極端に少なければ、検出力の計算が前提を失う。ここが落ちたら、それ自体が
    // 発見である（交絡の多さ、または踏破率の低さ）。assert を緩めずに報告すること。
    expect(allPairs.length).toBeGreaterThan(0);
  });
});
