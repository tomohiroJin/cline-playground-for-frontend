/**
 * 塔の実効射程のテスト
 *
 * 射程算出を effectiveRange に集約する。effectiveDamage と同じ形で、
 * 加算の二重適用を防ぐために算出責務を1箇所に閉じる。
 */
import { createCombatState } from './combat-state';
import type { CombatState, ActiveEnemy } from './combat-state';
import { effectiveRange } from './step-tick';
import { PLAINS_WAVES } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

/** effectiveDamage の対象引数用ダミー（特効を持たない塔のテストでは値は結果に影響しない） */
const dummyTarget: ActiveEnemy = {
  id: 0,
  enemyId: 'grunt',
  hp: 20,
  maxHp: 20,
  progress: 0,
  spawnTick: 0,
  laneIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
};

const withTowers = (towers: { cardId: string; x: number; y: number }[]): CombatState => ({
  ...createCombatState(emptyDeck, PLAINS_WAVES),
  towers: towers.map((t) => ({ cardId: t.cardId, pos: { x: t.x, y: t.y }, cooldownLeft: 0 })),
});

describe('effectiveRange', () => {
  it('支援が無ければカード定義の射程そのまま', () => {
    const state = withTowers([{ cardId: 'arrow-tower', x: 1, y: 2 }]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(1.6, 5);
  });

  it('隣接する鍛冶場が射程を +0.6 する', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'forge', x: 2, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(2.2, 5);
  });

  it('隣接していない鍛冶場は効かない', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'forge', x: 5, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(1.6, 5);
  });

  it('鍛冶場2基なら +1.2（加算）', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 2, y: 2 },
      { cardId: 'forge', x: 1, y: 2 },
      { cardId: 'forge', x: 3, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(2.8, 5);
  });

  it('篝火は射程を変えない（火力オーラのみ）', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'beacon', x: 2, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(1.6, 5);
  });

  it('鍛冶場は火力を変えない（射程オーラのみ）', async () => {
    const { effectiveDamage } = await import('./step-tick');
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'forge', x: 2, y: 2 },
    ]);
    expect(effectiveDamage(state, 0, PLAINS_MAP, dummyTarget)).toBe(6);
  });

  it('オーラ塔自身の実効射程は 0', () => {
    const state = withTowers([{ cardId: 'forge', x: 1, y: 2 }]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBe(0);
  });
});
