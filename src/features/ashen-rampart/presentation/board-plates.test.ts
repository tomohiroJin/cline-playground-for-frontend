/**
 * 台座モデルのテスト
 *
 * 状態バーは常に1本で、意味は役割が決める（設計書 §5.1）。
 * 守り手=残HP、罠=残り回数、燠=再点火の進捗、炉=マナ生成の進捗。
 */
import { buildPlates } from './board-plates';
import type { CombatState, PlacedUnit, PlacedTrap, PlacedReactor, PlacedEmber } from '../domain/combat/combat-state';
import { createCombatState } from '../domain/combat/combat-state';
import type { DeckState } from '../domain/cards/deck';

/**
 * テスト用に必要な部分だけ持つ CombatState を組む
 *
 * 最小限の有効な DeckState で createCombatState を初期化し、
 * spread で overrides を適用する。これにより TypeScript は完全な
 * CombatState を保証し、as キャストを避けられる。
 */
const stateWith = (overrides: {
  units?: PlacedUnit[];
  traps?: PlacedTrap[];
  reactors?: PlacedReactor[];
  embers?: PlacedEmber[];
  events?: CombatState['events'];
}): CombatState => {
  const emptyDeck: DeckState = { drawPile: [], hand: [], graveyard: [] };
  const base = createCombatState(emptyDeck, []);
  return {
    ...base,
    units: overrides.units ?? [],
    traps: overrides.traps ?? [],
    reactors: overrides.reactors ?? [],
    embers: overrides.embers ?? [],
    events: overrides.events ?? [],
  };
};

describe('buildPlates', () => {
  it('守り手のバーは残HPを表す', () => {
    const plates = buildPlates(
      stateWith({
        units: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 4, maxHp: 8, cooldownLeft: 0 },
        ],
      })
    );
    expect(plates).toHaveLength(1);
    expect(plates[0].statusNow).toBe(4);
    expect(plates[0].statusMax).toBe(8);
    expect(plates[0].statusLabel).toBe('弓兵 の耐久');
    expect(plates[0].visual.glyph).toBe('弓');
  });

  it('罠のバーは残り発動回数を表す', () => {
    const plates = buildPlates(
      stateWith({
        traps: [{ cardId: 'spike-trap', pos: { x: 2, y: 2 }, usesLeft: 2, hitEnemyIds: [] }],
      })
    );
    expect(plates[0].statusNow).toBe(2);
    expect(plates[0].statusMax).toBe(3);
    expect(plates[0].statusLabel).toBe('棘罠 の残り回数');
  });

  it('燠火のバーは再点火までの進捗を表す（残りではなく経過）', () => {
    const plates = buildPlates(
      stateWith({ embers: [{ pos: { x: 3, y: 3 }, cooldownLeft: 0 }] })
    );
    // cooldownLeft 0 = 再点火可能 = 満タン
    expect(plates[0].statusNow).toBe(plates[0].statusMax);
    expect(plates[0].visual.glyph).toBe('燠');
  });

  it('魔力炉のバーは次のマナ生成までの進捗を表す', () => {
    const plates = buildPlates(
      stateWith({ reactors: [{ pos: { x: 4, y: 4 }, ticksToMana: 0 }] })
    );
    expect(plates[0].statusNow).toBe(plates[0].statusMax);
    expect(plates[0].statusLabel).toBe('魔力炉 のマナ生成');
  });

  it('この tick に撃った攻撃塔は isFiring になる', () => {
    const unit = { cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 3 };
    const shot = {
      kind: 'shot' as const,
      unitIndex: 0,
      targetId: 1,
      auraDamageBonus: 0,
      beyondBaseRange: false,
    };
    const fired = buildPlates(stateWith({ units: [unit], events: [shot] }));
    const idle = buildPlates(stateWith({ units: [unit], events: [] }));
    expect(fired[0].isFiring).toBe(true);
    expect(idle[0].isFiring).toBe(false);
  });

  it('別の守り手が撃っても自分は isFiring にならない（index で対応づける）', () => {
    const plates = buildPlates(
      stateWith({
        units: [
          { cardId: 'stone-wall', pos: { x: 1, y: 1 }, hp: 60, maxHp: 60, cooldownLeft: 0 },
          { cardId: 'arrow-tower', pos: { x: 2, y: 1 }, hp: 8, maxHp: 8, cooldownLeft: 3 },
        ],
        events: [
          { kind: 'shot', unitIndex: 1, targetId: 1, auraDamageBonus: 0, beyondBaseRange: false },
        ],
      })
    );
    expect(plates[0].isFiring).toBe(false);
    expect(plates[1].isFiring).toBe(true);
  });

  it('4種の設置物が同時にあってもすべて台座になる', () => {
    const plates = buildPlates(
      stateWith({
        units: [{ cardId: 'ballista', pos: { x: 0, y: 0 }, hp: 12, maxHp: 12, cooldownLeft: 0 }],
        traps: [{ cardId: 'snare-net', pos: { x: 1, y: 0 }, usesLeft: 3, hitEnemyIds: [] }],
        reactors: [{ pos: { x: 2, y: 0 }, ticksToMana: 5 }],
        embers: [{ pos: { x: 3, y: 0 }, cooldownLeft: 10 }],
      })
    );
    expect(plates.map((p) => p.visual.glyph).sort()).toEqual(['弩', '燠', '炉', '網'].sort());
  });
});
