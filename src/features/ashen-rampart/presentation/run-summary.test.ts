/**
 * 灰燼の城壁 - 判定7項目の集計
 *
 * events は毎 tick 消えるため、tick ごとに累積する。
 * 「配置時に選べたマス数」は prevState から機械的に再計算する
 * （UI の選択状態に依存させると、拒否されたクリックも数えてしまう）。
 */
import { PLAINS_MAP } from '../domain/board/stage-map';
import { createDeck } from '../domain/cards/deck';
import { createCombatState, type CombatState } from '../domain/combat/combat-state';
import type { WaveDefinition } from '../domain/combat/waves';
import { accumulateTick, emptyTally, summarize } from './run-summary';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
const base = (over: Partial<CombatState> = {}): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  ...over,
});

describe('accumulateTick', () => {
  it('守り手別の撃破数を数える', () => {
    const prev = base();
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
    const tally = accumulateTick(emptyTally(), prev, state, PLAINS_MAP);
    expect(tally.defeatsByCard['arrow-tower']).toBe(2);
    expect(tally.defeatsByCard['spike-trap']).toBe(1);
  });

  it('支援守り手の貢献を2つの単位で数える', () => {
    const state = base({
      tick: 5,
      events: [
        { kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 2, beyondBaseRange: false },
        { kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 3, beyondBaseRange: true },
      ],
    });
    const tally = accumulateTick(emptyTally(), base(), state, PLAINS_MAP);
    expect(tally.beaconBonusDamage).toBe(5);
    expect(tally.forgeExtendedShots).toBe(1);
  });

  it('拒否を理由別に数える', () => {
    const state = base({
      tick: 3,
      events: [
        { kind: 'rejected', reason: 'mana' },
        { kind: 'rejected', reason: 'cooldown' },
        { kind: 'rejected', reason: 'mana' },
      ],
    });
    const tally = accumulateTick(emptyTally(), base(), state, PLAINS_MAP);
    expect(tally.rejections.mana).toBe(2);
    expect(tally.rejections.cooldown).toBe(1);
  });

  it('配置が成立した瞬間に選べたマス数を記録する', () => {
    const prev = base({ mana: 5 });
    const state = base({
      tick: 10,
      mana: 3,
      events: [{ kind: 'played', cardId: 'arrow-tower', pos: { x: 1, y: 2 } }],
    });
    const tally = accumulateTick(emptyTally(), prev, state, PLAINS_MAP);
    // 反復3 Task 8 で設置マスの規則を廃止し、守り手（arrow-tower は unit 種別）は
    // 砦セル以外のどこにでも置けるようになった。盤面は9×7=63マス、唯一置けないのは
    // 砦1マスのみ（prev は何も置かれていない空の盤面）なので 63-1=62
    expect(tally.placeableCounts).toEqual([62]);
  });

  it('魔力炉の初号機が置かれた tick を記録する', () => {
    const state = base({
      tick: 210,
      events: [{ kind: 'played', cardId: 'reactor', pos: { x: 1, y: 2 } }],
    });
    const tally = accumulateTick(emptyTally(), base(), state, PLAINS_MAP);
    expect(tally.firstReactorTick).toBe(210);
  });

  it('手札が非空で1枚も払えない tick をマナ待ちとして数える', () => {
    const state = base({ tick: 4, mana: 0 });
    const withExpensiveHand: CombatState = {
      ...state,
      deck: { ...state.deck, hand: ['arrow-tower'] },
    };
    const tally = accumulateTick(emptyTally(), base(), withExpensiveHand, PLAINS_MAP);
    expect(tally.manaStarvedTicks).toBe(1);
  });
});

describe('summarize', () => {
  it('選べたマスの平均と最小を出す', () => {
    const tally = { ...emptyTally(), placeableCounts: [4, 12, 20] };
    const view = summarize(tally, ['reactor']);
    expect(view.placeableAverage).toBe(12);
    expect(view.placeableMin).toBe(4);
  });

  it('デッキにあって一度も場に出なかった札を挙げる', () => {
    const tally = { ...emptyTally(), playedCardIds: new Set(['arrow-tower']) };
    const view = summarize(tally, ['arrow-tower', 'stone-wall', 'forge', 'forge']);
    expect(view.unusedCardNames).toEqual(['石壁', '鍛冶場']);
  });
});
