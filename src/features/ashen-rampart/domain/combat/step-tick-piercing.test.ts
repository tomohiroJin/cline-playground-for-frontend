import { createCombatState } from './combat-state';
import { stepTick } from './step-tick';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import type { CombatState } from './combat-state';

describe('貫通（徹甲弩）', () => {
  const wave = [{
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 4, laneIndex: 0 }],
  }];

  const setup = (cardId: string): CombatState => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[5]!;
    // 経路の隣（1マス上）に守り手を置く。列に並んだ敵を横から撃つ形
    const shooter = { x: blockCell.x, y: blockCell.y - 1 };
    const deck = createDeck(['stone-wall', cardId], () => 0);
    let state = { ...createCombatState(deck, wave), mana: 20 };
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: shooter }], PLAINS_MAP);
    return state;
  };

  it('1回の射撃で2体以上にダメージが入る', () => {
    let state = setup('piercer');
    let maxHitsInOneTick = 0;
    for (let i = 0; i < 300; i++) {
      const before = state.enemies.map((e) => e.hp);
      state = stepTick(state, [], PLAINS_MAP);
      const hits = state.enemies.filter((e, idx) => {
        const prev = before[idx];
        return prev !== undefined && e.hp < prev;
      }).length;
      maxHitsInOneTick = Math.max(maxHitsInOneTick, hits);
    }
    expect(maxHitsInOneTick).toBeGreaterThanOrEqual(2);
  });

  it('貫通しない守り手（弩砲）は同じ条件で1体までしか当たらない', () => {
    let state = setup('ballista');
    let maxHitsInOneTick = 0;
    for (let i = 0; i < 300; i++) {
      const before = state.enemies.map((e) => e.hp);
      state = stepTick(state, [], PLAINS_MAP);
      const hits = state.enemies.filter((e, idx) => {
        const prev = before[idx];
        return prev !== undefined && e.hp < prev;
      }).length;
      maxHitsInOneTick = Math.max(maxHitsInOneTick, hits);
    }
    expect(maxHitsInOneTick).toBe(1);
  });
});
