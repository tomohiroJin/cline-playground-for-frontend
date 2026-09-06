/**
 * 暫定ステージが宣言した要求軸を実際に要求するかの監査（設計書 §8.2.6(j)）
 *
 * **これは測定であって合否判定ではない。閾値の assert を置かない。**
 * 数値は判定票へ人が転記する。
 *
 * CI には常駐させない（§8.2.6(e)）。実行するには:
 *   ASHEN_RAMPART_AUDIT=1 npx jest stage-demand-audit
 */
import { createDeck } from '../../domain/cards/deck';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { createCombatState } from '../../domain/combat/combat-state';
import { greedyStrategy, simulateRun } from '../../domain/combat/run-simulation';
import { withoutAxisStrategy } from '../../domain/expedition/axis-strategy';
import { PROVISIONAL_STAGES } from '../../domain/expedition/stage-pool';
import { axesOf, type DemandAxis } from '../../domain/expedition/stage-definition';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import type { Strategy } from '../../domain/combat/run-simulation';
import type { StageDefinition } from '../../domain/expedition/stage-definition';

const ALL_AXES: readonly DemandAxis[] = ['block', 'anti-air', 'mass-answer', 'heavy-hit'];

/**
 * 1条件あたりのシード数
 *
 * `ASHEN_RAMPART_AUDIT_SEEDS` は**動作確認専用の縮小口**である。
 * 監査の結果を読むときは必ず既定値（20）で実行すること。
 */
const SEEDS = Number(process.env.ASHEN_RAMPART_AUDIT_SEEDS ?? 20);
const isEnabled = process.env.ASHEN_RAMPART_AUDIT === '1';

const winsOf = (stage: StageDefinition, cards: readonly string[], strategy: Strategy): number => {
  let wins = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const random = createSeededRandom(seed);
    const deck = createDeck(cards, () => random.random());
    const result = simulateRun(createCombatState(deck, stage.waves), strategy, stage.map);
    if (result.outcome === 'won') wins++;
  }
  return wins;
};

(isEnabled ? describe : describe.skip)('暫定ステージの要求軸の監査', () => {
  jest.setTimeout(300000);

  it('各カードがどの軸を持つかを一覧する（監査の前提の確認）', () => {
    const rows = [...new Set(Object.values(PRESET_DECKS).flatMap((p) => p.cards))]
      .sort()
      .map((id) => `  ${id.padEnd(14)} ${axesOf(id).join(', ') || '(なし)'}`);
    console.log(['カード → 要求軸', ...rows].join('\n'));

    // 監査が成立する前提: 4つの軸すべてに、それを満たす札が存在する
    ALL_AXES.forEach((axis) => {
      const providers = [...new Set(Object.values(PRESET_DECKS).flatMap((p) => p.cards))]
        .filter((id) => axesOf(id).includes(axis));
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  it.each(Object.values(PRESET_DECKS).map((p) => [p.id, p.cards] as const))(
    '%s デッキ: 宣言軸と非宣言軸の落とし比べ',
    (presetId, cards) => {
      const lines: string[] = [`--- プリセット ${presetId} ---`];
      PROVISIONAL_STAGES.forEach((stage) => {
        const baseline = winsOf(stage, cards, greedyStrategy);
        const drops = ALL_AXES.map((axis) => {
          const wins = winsOf(stage, cards, withoutAxisStrategy(axis));
          const declared = stage.demands.includes(axis);
          return `${declared ? '★' : '  '}${axis.padEnd(12)} ${wins}/${SEEDS} (差 ${baseline - wins})`;
        });
        lines.push(
          `${stage.id} 宣言=[${stage.demands.join(',')}] 基準 ${baseline}/${SEEDS}`,
          ...drops.map((d) => `    ${d}`)
        );

        // **閾値ではない構造的な検査**: 基準戦略が一度も勝てないステージでは
        // 「軸を落とすと弱くなるか」を測れない（下限に張り付いて差が出ない）。
        // ここが落ちたら、それ自体が発見である。assert を緩めずに報告すること。
        expect(baseline).toBeGreaterThan(0);
      });
      console.log(lines.join('\n'));
    }
  );
});
