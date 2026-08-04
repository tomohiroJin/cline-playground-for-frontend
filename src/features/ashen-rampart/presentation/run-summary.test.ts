/**
 * 灰燼の城壁 - 判定7項目の集計
 *
 * events は毎 tick 消えるため、tick ごとに累積する。
 * 反復3 で集計項目を設計書 §9.1 の7項目に差し替えた。集計は state.events と
 * state.enemies だけを見るため、accumulateTick はもう prevState を取らない
 * （配置時に選べたマス数の集計を廃止したため。反復2 まではこれの再計算に
 * prevState が必要だった）。
 */
import { PLAINS_MAP, laneOf } from '../domain/board/stage-map';
import { createDeck } from '../domain/cards/deck';
import { createCombatState, type CombatState, type TickEvent } from '../domain/combat/combat-state';
import type { WaveDefinition } from '../domain/combat/waves';
import { accumulateTick, emptyTally, summarize } from './run-summary';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
const base = (over: Partial<CombatState> = {}): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  ...over,
});

/** イベントだけを差し替えた状態を作る。集計は events（と defeat の敵参照）しか見ないため */
const stateWithEvents = (events: TickEvent[]): CombatState => base({ tick: 5, events });

const stateWithPlayed = (cardId: string, pos: { x: number; y: number }): CombatState =>
  stateWithEvents([{ kind: 'played', cardId, pos }]);

/** 鴉を指定の進捗比で倒した状態。進捗比 = progress / (lane.length - 1) */
const stateWithRavenDefeatedAt = (ratio: number): CombatState => {
  const lane = laneOf(PLAINS_MAP, 0);
  const withEvent = stateWithEvents([
    { kind: 'defeat', enemyId: 1, source: { kind: 'unit', index: 0 } },
  ]);
  return {
    ...withEvent,
    enemies: [
      {
        id: 1,
        enemyId: 'raven',
        hp: 0,
        maxHp: 16,
        progress: ratio * (lane.length - 1),
        spawnTick: 0,
        laneIndex: 0,
        alive: false,
        leaked: false,
        groundedUntilTick: 0,
      },
    ],
  };
};

describe('accumulateTick', () => {
  it('守り手別の撃破数を数える', () => {
    const state = base({
      tick: 5,
      events: [
        { kind: 'defeat', enemyId: 1, source: { kind: 'unit', index: 0 } },
        { kind: 'defeat', enemyId: 2, source: { kind: 'unit', index: 0 } },
        { kind: 'defeat', enemyId: 3, source: { kind: 'trap', index: 1 } },
      ],
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
      traps: [
        { cardId: 'spike-trap', pos: { x: 0, y: 3 }, usesLeft: 1, hitEnemyIds: [] },
        { cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 1, hitEnemyIds: [] },
      ],
    });
    const tally = accumulateTick(emptyTally(), state, PLAINS_MAP);
    expect(tally.defeatsByUnit['arrow-tower']).toBe(2);
    expect(tally.defeatsByUnit['spike-trap']).toBe(1);
  });

  it('支援守り手の貢献を2つの単位で数える', () => {
    const state = base({
      tick: 5,
      events: [
        { kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 2, beyondBaseRange: false },
        { kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 3, beyondBaseRange: true },
      ],
    });
    const tally = accumulateTick(emptyTally(), state, PLAINS_MAP);
    expect(tally.beaconBonusDamage).toBe(5);
    expect(tally.forgeExtendedShots).toBe(1);
  });

  it('拒否を理由別に数える（クールダウン限定が効いたかの確認用に残す）', () => {
    const state = base({
      tick: 3,
      events: [
        { kind: 'rejected', reason: 'mana' },
        { kind: 'rejected', reason: 'cooldown' },
        { kind: 'rejected', reason: 'mana' },
      ],
    });
    const tally = accumulateTick(emptyTally(), state, PLAINS_MAP);
    expect(tally.rejectionCounts.mana).toBe(2);
    expect(tally.rejectionCounts.cooldown).toBe(1);
  });

  describe('判定7項目の集計', () => {
    it('項目1: 2レーンへの配置数の配分を数える', () => {
      let tally = emptyTally();
      tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 2 }), PLAINS_MAP);
      tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 4 }), PLAINS_MAP);
      expect(tally.laneAllocation).toEqual([1, 1]);
    });

    it('項目2: ブロッカーを置いたレーン内位置を記録する', () => {
      let tally = emptyTally();
      tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 2 }), PLAINS_MAP);
      expect(tally.blockerPositions).toEqual([{ laneIndex: 0, index: 3 }]);
    });

    it('項目3: 失った守り手を種類ごとに数える', () => {
      let tally = emptyTally();
      tally = accumulateTick(
        tally,
        stateWithEvents([
          { kind: 'unit-lost', unitIndex: 0, cardId: 'stone-wall', pos: { x: 3, y: 2 } },
          { kind: 'unit-lost', unitIndex: 0, cardId: 'arrow-tower', pos: { x: 4, y: 2 } },
        ]),
        PLAINS_MAP
      );
      expect(tally.unitsLost).toEqual({ 'stone-wall': 1, 'arrow-tower': 1 });
    });

    it('項目4: 経路上と経路外の配置数を分けて数える', () => {
      let tally = emptyTally();
      tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 2 }), PLAINS_MAP);
      tally = accumulateTick(tally, stateWithPlayed('arrow-tower', { x: 4, y: 3 }), PLAINS_MAP);
      const view = summarize(tally, []);
      expect(view.onPathRatio).toBeCloseTo(0.5);
    });

    it('項目4: 罠・魔力炉のような置ける場所が固定のカードは比率に含めない', () => {
      // 罠は経路限定、魔力炉は経路外限定と置ける場所自体が固定されているため、
      // 含めると経路上/外の比率が常に両端へ振れず判定として機能しなくなる（設計書 §9.1）
      let tally = emptyTally();
      tally = accumulateTick(tally, stateWithPlayed('spike-trap', { x: 3, y: 2 }), PLAINS_MAP);
      tally = accumulateTick(tally, stateWithPlayed('reactor', { x: 4, y: 3 }), PLAINS_MAP);
      expect(tally.placedOnPath).toBe(0);
      expect(tally.placedOffPath).toBe(0);
    });

    it('項目5: 鴉の撃破位置を進捗比で記録する', () => {
      let tally = emptyTally();
      tally = accumulateTick(tally, stateWithRavenDefeatedAt(0.25), PLAINS_MAP);
      expect(tally.ravenDefeatProgress).toEqual([0.25]);
    });

    it('項目6: 使ったカードのコスト帯を数える', () => {
      let tally = emptyTally();
      tally = accumulateTick(tally, stateWithPlayed('arrow-tower', { x: 4, y: 3 }), PLAINS_MAP);
      expect(tally.costHistogram[1]).toBe(1);
    });

    it('項目6: 一度も出なかったカード種を返す', () => {
      const view = summarize(emptyTally(), ['arrow-tower', 'stone-wall']);
      expect(view.unusedCardIds).toEqual(['arrow-tower', 'stone-wall']);
    });
  });
});

describe('summarize', () => {
  it('鴉を1体も倒していなければ平均進捗を0、件数を0にする', () => {
    const view = summarize(emptyTally(), []);
    expect(view.ravenDefeatAverage).toBe(0);
    expect(view.ravenDefeatCount).toBe(0);
  });

  it('デッキにあって一度も場に出なかった札を id で挙げる', () => {
    const tally = { ...emptyTally(), playedCardIds: new Set(['arrow-tower']) };
    const view = summarize(tally, ['arrow-tower', 'stone-wall', 'forge', 'forge']);
    expect(view.unusedCardIds).toEqual(['stone-wall', 'forge']);
  });
});
