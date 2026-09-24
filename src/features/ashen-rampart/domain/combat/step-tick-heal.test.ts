/**
 * 癒し手の回復（反復7 段階2・設計書 §4.1 / §4.2 (2)）
 *
 * 回復は hpById を種まきした直後、罠より前に入る。したがって同じ tick に
 * 削られた敵が「削られた後に戻る」ことは構造的に起きない。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type ActiveEnemy, type CombatState, type PlacedTrap } from './combat-state';
import { stepTick } from './step-tick';
import { getEnemySpec } from './enemies';
import type { WaveDefinition } from './waves';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
const HEAL = getEnemySpec('mender').heal!;
/** 次の stepTick が回復の tick になる tick */
const BEFORE_HEAL_TICK = HEAL.intervalTicks - 1;

const onLane0 = (overrides: Partial<ActiveEnemy> & Pick<ActiveEnemy, 'id' | 'enemyId' | 'progress'>): ActiveEnemy => ({
  hp: 20, maxHp: 20, spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
  ...overrides,
});

// 癒し手と雑兵は同じ速さ（0.1）で進むので、1 tick の後も距離は 1.0 のまま（半径1.5 以内）
const mender = (): ActiveEnemy => onLane0({ id: 1, enemyId: 'mender', progress: 0.95, hp: 18, maxHp: 18 });
const grunt = (hp: number, progress = 1.95): ActiveEnemy => onLane0({ id: 2, enemyId: 'grunt', progress, hp });

const stateAt = (tick: number, enemies: ActiveEnemy[], traps: PlacedTrap[] = []): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  tick,
  enemies,
  traps,
});

/** 雑兵が 1 tick 後に乗るセル (2,2) の棘罠（ダメージ5） */
const spikeAt2_2 = (): PlacedTrap => ({ cardId: 'spike-trap', pos: { x: 2, y: 2 }, usesLeft: 3, hitEnemyIds: [] });

const hpOf = (state: CombatState, id: number): number | undefined =>
  state.enemies.find((e) => e.id === id)?.hp;

describe('癒し手の回復', () => {
  it('回復の間隔の tick に、周囲の傷ついた敵を回復量だけ戻す', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(10)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(10 + HEAL.amount);
    expect(next.events).toContainEqual({ kind: 'enemy-healed', healerId: 1, targetId: 2, amount: HEAL.amount });
  });

  it('maxHp を超えない（実際に戻した量だけを記録する）', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(19)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(20);
    expect(next.events).toContainEqual({ kind: 'enemy-healed', healerId: 1, targetId: 2, amount: 1 });
  });

  it('満タンの敵には何もしない（イベントも積まない）', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(20)]), [], PLAINS_MAP);

    expect(next.events.some((e) => e.kind === 'enemy-healed')).toBe(false);
  });

  it('間隔でない tick には回復しない', () => {
    const next = stepTick(stateAt(HEAL.intervalTicks, [mender(), grunt(10)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(10);
  });

  it('半径の外の敵は回復しない', () => {
    // 1 tick 後の距離は 2.0（半径1.5 の外）
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(10, 2.95)]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(10);
  });

  it('自分自身は回復しない', () => {
    const hurt = { ...mender(), hp: 10 };
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [hurt]), [], PLAINS_MAP);

    expect(hpOf(next, 1)).toBe(10);
  });

  it('回復は罠より前に入る: 満タンの敵が同じ tick に罠で削られても、回復は乗らない', () => {
    // 回復が罠の後なら 20-5 → 15 に +3 されて 18 になる。前なら満タンなので回復なしで 15
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(20)], [spikeAt2_2()]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(15);
    expect(next.events.some((e) => e.kind === 'enemy-healed')).toBe(false);
  });

  it('回復してから罠で削る: 3 → 6 → 1 で生き残る', () => {
    const next = stepTick(stateAt(BEFORE_HEAL_TICK, [mender(), grunt(3)], [spikeAt2_2()]), [], PLAINS_MAP);

    expect(hpOf(next, 2)).toBe(1);
    expect(next.enemies.find((e) => e.id === 2)?.alive).toBe(true);
  });
});
