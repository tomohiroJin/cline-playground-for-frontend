/**
 * 盾衛の装甲（反復7 段階2・設計書 §4.1 / §4.4）
 *
 * 装甲4 と弓兵4 の関係は意図的である。素の弓兵は通らず、篝火（+25%）の隣なら1通る。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type ActiveEnemy, type CombatState, type PlacedUnit } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

/** 北レーンの (2,2) にいる盾衛。1 tick で 0.06 進むだけなので弓兵の射程から出ない */
const warden = (): ActiveEnemy => ({
  id: 1, enemyId: 'warden', hp: 45, maxHp: 45, progress: 2, spawnTick: 0,
  laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
});

const tower = (cardId: string, x: number, y: number): PlacedUnit => ({
  cardId, pos: { x, y }, hp: 10, maxHp: 10, cooldownLeft: 0,
});

const withUnits = (units: PlacedUnit[]): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  units,
  enemies: [warden()],
});

describe('盾衛の装甲', () => {
  it('素の弓兵（攻撃4）は装甲4 の盾衛を削れず、軽減0 の命中として記録される', () => {
    const next = stepTick(withUnits([tower('arrow-tower', 2, 1)]), [], PLAINS_MAP);

    expect(next.enemies[0]?.hp).toBe(45);
    expect(next.events).toContainEqual({ kind: 'armor-hit', enemyId: 1, raw: 4, dealt: 0, armor: 4 });
  });

  it('篝火の隣の弓兵（攻撃5）は1通る', () => {
    const next = stepTick(
      withUnits([tower('arrow-tower', 2, 1), tower('beacon', 1, 1)]),
      [],
      PLAINS_MAP
    );

    expect(next.enemies[0]?.hp).toBe(44);
    expect(next.events).toContainEqual({ kind: 'armor-hit', enemyId: 1, raw: 5, dealt: 1, armor: 4 });
  });

  it('装甲は1ヒットごとに引く（弓兵2基の合計8 から一度だけ引くのではない）', () => {
    const next = stepTick(
      withUnits([tower('arrow-tower', 2, 1), tower('arrow-tower', 3, 1)]),
      [],
      PLAINS_MAP
    );

    expect(next.enemies[0]?.hp).toBe(45);
    expect(next.events.filter((e) => e.kind === 'armor-hit')).toHaveLength(2);
  });

  it('装甲に止められ続けても撃破されず、撃破源の契約違反（例外）も起きない', () => {
    let state = withUnits([tower('arrow-tower', 2, 1)]);
    for (let i = 0; i < 20; i += 1) state = stepTick(state, [], PLAINS_MAP);

    expect(state.enemies[0]?.alive).toBe(true);
    expect(state.enemies[0]?.hp).toBe(45);
  });
});
