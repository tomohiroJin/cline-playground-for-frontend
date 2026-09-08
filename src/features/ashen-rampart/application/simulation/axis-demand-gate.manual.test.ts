/**
 * `G3` — 要求軸の監査（設計書 §8.2.15）
 *
 * **これは測定であって合否判定ではない。閾値の assert を置かない。**
 * 数値は判定票 §8.2.16 へ人が転記する。
 *
 * CI には常駐させない。実行するには:
 *   ASHEN_RAMPART_G3=1 npx jest axis-demand-gate
 *
 * **主要対比は5本**（`anti-air` が prov-t2-b / prov-t3-a、
 * `mass-answer` が prov-t1-b / prov-t2-a / prov-t3-b）。
 * `block` と `heavy-hit` は用量の処置なので**探索的**である（§8.2.15(c)）。
 */
import { PRESET_DECKS, getCardDefinition } from '../../domain/cards/card-pool';
import { createDeck } from '../../domain/cards/deck';
import { knockoutIdOf } from '../../domain/cards/knockout-cards';
import { createCombatState } from '../../domain/combat/combat-state';
import { greedyStrategy, simulateRun } from '../../domain/combat/run-simulation';
import { HIGH_GROUND_DAMAGE_MULT } from '../../domain/combat/step-tick';
import { holmAdjust } from '../../domain/shared/holm';
import { mcnemarExactP } from '../../domain/shared/mcnemar';
import { AUDIT_FULL_DECK, knockoutDeck } from '../../domain/expedition/axis-knockout';
import { PROVISIONAL_STAGES } from '../../domain/expedition/stage-pool';
import { DEMAND_AXES, axesOf, type DemandAxis } from '../../domain/expedition/stage-definition';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import type { StageMap } from '../../domain/board/stage-map';
import type { StageDefinition } from '../../domain/expedition/stage-definition';

/**
 * シード帯（設計書 §8.2.15(h)）
 *
 * 1〜250 は §8.2.10(d) が使用を禁じた既使用帯。1351〜1450 は確認帯として封じてある
 * （ステージを直したあとの再測定でのみ使う。最大2回）。
 */
const SEED_FROM = 1251;
const N = 100;

const isEnabled = process.env.ASHEN_RAMPART_G3 === '1';

/** 1シードぶんの勝敗 */
const winsBySeed = (stage: StageDefinition, cards: readonly string[]): boolean[] =>
  Array.from({ length: N }, (_unused, i) => {
    const random = createSeededRandom(SEED_FROM + i);
    const deck = createDeck(cards, () => random.random());
    return simulateRun(createCombatState(deck, stage.waves), greedyStrategy, stage.map).outcome === 'won';
  });

interface Cell {
  stageId: string;
  axis: DemandAxis;
  declared: boolean;
  baseWins: number;
  koWins: number;
  b: number;
  c: number;
  p: number;
  /** 測定不能の理由（§8.2.15(g)）。空なら測定可能 */
  unmeasurable: string;
}

/** そのデッキに貫通する札が含まれるか（含むと anti-air は測定不能） */
const hasPiercingCard = (cards: readonly string[]): boolean =>
  cards.some((id) => getCardDefinition(id).tower?.piercing === true);

/**
 * そのデッキ・そのマップで到達しうるダメージ倍率の集合
 *
 * `damageBreakdown` は `Math.round(damage * 高台 * (1 + オーラ))` を計算する。
 * オーラは隣接する篝火ごとに加算されるので、デッキに入っている枚数まで積み上がる。
 * **新しいオーラ札が段階B で増えたら、ここは部分和しか列挙しない近似になる**
 * （現行プールのオーラは篝火 0.25 の1種だけなので厳密）。
 */
const reachableMultipliers = (cards: readonly string[], map: StageMap): number[] => {
  const auraSums = [0];
  let running = 0;
  cards.forEach((id) => {
    const bonus = getCardDefinition(id).tower?.aura?.towerDamageBonus ?? 0;
    if (bonus <= 0) return;
    running += bonus;
    auraSums.push(running);
  });
  const highGrounds = (map.highGround ?? []).length > 0 ? [1, HIGH_GROUND_DAMAGE_MULT] : [1];
  return highGrounds.flatMap((hg) => auraSums.map((aura) => hg * (1 + aura)));
};

/**
 * `heavy-hit` の分割が、実効ダメージの丸めを通しても DPS を保つか（`B0-P3` の実効版）
 *
 * 素の `damage / cooldownTicks` が一致しても、`Math.round` を通すとずれる
 * （投石機・高台だけで +4.35%、火砲台・篝火で +6.7%。設計書 §8.2.15(a)6）。
 * 比較は整数の交差積で行う（浮動小数の近似一致は不可・`B0-P3`）。
 */
const heavyHitDpsPreserved = (cards: readonly string[], map: StageMap): boolean => {
  const multipliers = reachableMultipliers(cards, map);
  return cards.every((id) => {
    if (!axesOf(id).includes('heavy-hit')) return true;
    const base = getCardDefinition(id).tower;
    const ko = getCardDefinition(knockoutIdOf('heavy-hit', id)).tower;
    if (!base || !ko) return false;
    return multipliers.every(
      (m) =>
        Math.round(base.damage * m) * ko.cooldownTicks ===
        Math.round(ko.damage * m) * base.cooldownTicks
    );
  });
};

/** §8.2.15(g) の3規則を機械的に当てる */
const unmeasurableReason = (
  axis: DemandAxis,
  baseWins: number,
  cards: readonly string[],
  map: StageMap
): string => {
  if (axis === 'anti-air' && hasPiercingCard(cards)) {
    return '貫通が飛行を絞らない（§8.2.15(a)5）';
  }
  if (axis === 'heavy-hit' && !heavyHitDpsPreserved(cards, map)) {
    return '丸めで実効DPSがずれる（§8.2.15(a)6）';
  }
  if (baseWins / N < 0.4) return 'B0-P4 基準勝率 < 0.40';
  return '';
};

const measure = (stage: StageDefinition, cards: readonly string[]): Cell[] => {
  const base = winsBySeed(stage, cards);
  return DEMAND_AXES.map((axis) => {
    const ko = winsBySeed(stage, knockoutDeck(cards, axis));
    let b = 0;
    let c = 0;
    base.forEach((won, i) => {
      if (won && !ko[i]) b++;
      if (!won && ko[i]) c++;
    });
    const baseWins = base.filter(Boolean).length;
    return {
      stageId: stage.id,
      axis,
      declared: stage.demands.includes(axis),
      baseWins,
      koWins: ko.filter(Boolean).length,
      b,
      c,
      p: mcnemarExactP(b, c),
      unmeasurable: unmeasurableReason(axis, baseWins, cards, stage.map),
    };
  });
};

/** 主要対比か（宣言軸のうち anti-air と mass-answer のみ。§8.2.15(c)） */
const isPrimary = (cell: Cell): boolean =>
  cell.declared && (cell.axis === 'anti-air' || cell.axis === 'mass-answer');

const render = (cells: readonly Cell[], holmByCell: ReadonlyMap<Cell, number>): string =>
  cells
    .map((cell) => {
      const ratio = cell.baseWins === 0 ? NaN : cell.koWins / cell.baseWins;
      const holm = holmByCell.get(cell);
      return (
        `  ${cell.declared ? '★' : ' '}${cell.stageId.padEnd(10)} ${cell.axis.padEnd(12)}` +
        ` 基準 ${String(cell.baseWins).padStart(3)}/${N}` +
        ` ko ${String(cell.koWins).padStart(3)}/${N}` +
        ` 比 ${Number.isNaN(ratio) ? ' n/a ' : ratio.toFixed(3)}` +
        ` b=${String(cell.b).padStart(3)} c=${String(cell.c).padStart(3)}` +
        ` p=${cell.p.toExponential(3)}` +
        ` holm=${holm === undefined ? '     -' : holm.toFixed(5)}` +
        (cell.unmeasurable === '' ? '' : `  [測定不能: ${cell.unmeasurable}]`)
      );
    })
    .join('\n');

(isEnabled ? describe : describe.skip)('G3 要求軸の監査', () => {
  jest.setTimeout(1800000);

  it('主要デッキ（全軸充足12枚）', () => {
    const cells = PROVISIONAL_STAGES.flatMap((stage) => measure(stage, AUDIT_FULL_DECK));
    const primary = cells.filter(isPrimary);

    // **測定不能でも族から外さない**（§8.2.15(g)）。データを見てから族を変えないため
    const holmByCell = new Map<Cell, number>();
    holmAdjust(primary.map((cell) => cell.p)).forEach((adjusted, i) => {
      const cell = primary[i];
      if (cell) holmByCell.set(cell, adjusted);
    });

    const unmeasurable = primary.filter((cell) => cell.unmeasurable !== '');
    console.log(
      [
        `=== 主要デッキ（シード ${SEED_FROM}..${SEED_FROM + N - 1}）===`,
        `主要対比 ${primary.length} 本（Holm 補正あり・族サイズは固定）。それ以外は探索的（補正なし）`,
        `測定不能 ${unmeasurable.length} 本（§8.2.15(k): 2本以上なら評価不能）`,
        render(cells, holmByCell),
      ].join('\n')
    );

    // 構造的な検査のみ。合否の閾値は置かない（判定票へ転記する）
    expect(primary).toHaveLength(5);
  });

  it.each(Object.values(PRESET_DECKS).map((p) => [p.id, p.cards] as const))(
    '%s デッキ（探索的）',
    (presetId, cards) => {
      const cells = PROVISIONAL_STAGES.flatMap((stage) => measure(stage, cards));
      console.log(
        [`=== ${presetId}（探索的・補正なし）===`, render(cells, new Map<Cell, number>())].join('\n')
      );
      expect(cells.length).toBeGreaterThan(0);
    }
  );
});
