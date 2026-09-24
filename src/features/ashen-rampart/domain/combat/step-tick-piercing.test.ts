import { createCombatState } from './combat-state';
import { stepTick } from './step-tick';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import type { CombatState } from './combat-state';
import { knockoutIdOf } from '../cards/knockout-cards';
import { KNOCKOUT_CARD_IDS } from '../cards/card-pool';
import type { ActiveEnemy } from './combat-state';
import type { WaveDefinition } from './waves';

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

describe('貫通の飛行判定（反復7 段階2・PR #201 minor #6）', () => {
  // 現行の徹甲弩は hitsFlying: true なので差が出ない。対空をノックアウトした変種
  // （hitsFlying: false・piercing: true）で「直線上の鴉に当たらない」ことを確かめる
  const KNOCKED_PIERCER = knockoutIdOf('anti-air', 'piercer');
  const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
  const onLane0 = (id: number, enemyId: string, progress: number, hp: number): ActiveEnemy => ({
    id, enemyId, hp, maxHp: hp, progress, spawnTick: 0, laneIndex: 0,
    alive: true, leaked: false, groundedUntilTick: 0,
  });
  // (3,1) から真下の雑兵 (3,2) を撃つ。鴉は同じレーンのすぐ先（x≈3.3）にいて、
  // 射線（x=3 の線分）から 0.5 以内に入る
  const setup = (cardId: string): CombatState => ({
    ...createCombatState(createDeck(['reactor'], () => 0), noWave),
    units: [{ cardId, pos: { x: 3, y: 1 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    enemies: [onLane0(1, 'grunt', 3.0, 20), onLane0(2, 'raven', 3.2, 16)],
  });

  it('前提: 対空をノックアウトした徹甲弩は、貫通のまま対空だけを失っている', () => {
    expect(KNOCKOUT_CARD_IDS).toContain(KNOCKED_PIERCER);
  });

  it('対空でない貫通の塔は、直線上の鴉に当たらない', () => {
    const next = stepTick(setup(KNOCKED_PIERCER), [], PLAINS_MAP);

    expect(next.enemies.find((e) => e.id === 1)?.hp).toBeLessThan(20);
    expect(next.enemies.find((e) => e.id === 2)?.hp).toBe(16);
  });

  it('対空の貫通の塔（本物の徹甲弩）は、直線上の鴉にも当たる（挙動は変わらない）', () => {
    const next = stepTick(setup('piercer'), [], PLAINS_MAP);

    expect(next.enemies.find((e) => e.id === 2)?.hp).toBeLessThan(16);
  });
});
