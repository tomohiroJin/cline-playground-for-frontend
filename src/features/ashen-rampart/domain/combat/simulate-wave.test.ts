import { PLAINS_MAP } from '../board/stage-map';
import { createBoard, placeTower, placeTrap } from '../board/board-state';
import { simulateWave, NO_MODIFIERS } from './simulate-wave';
import type { WaveDefinition } from './waves';

const SMALL_WAVE: WaveDefinition = {
  entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 10 }],
};

describe('simulateWave', () => {
  it('タワーなしなら全敵が漏れる', () => {
    const board = createBoard(PLAINS_MAP);
    const result = simulateWave(board, SMALL_WAVE);
    expect(result.leaked).toBe(3);
    expect(result.defeated).toBe(0);
    expect(result.ticks.length).toBeGreaterThan(0);
  });

  it('同一入力からは同一の結果になる（決定性）', () => {
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'arrow-tower',
      PLAINS_MAP.buildSlots[0]
    );
    const a = simulateWave(board, SMALL_WAVE);
    const b = simulateWave(board, SMALL_WAVE);
    expect(a).toEqual(b);
  });

  it('タワーを並べれば敵を撃破しスコア報酬を得る', () => {
    let board = createBoard(PLAINS_MAP);
    // 経路沿いの設置マス全部に弓兵の塔を建てる（過剰火力）
    for (const slot of PLAINS_MAP.buildSlots) {
      board = placeTower(board, 'arrow-tower', slot);
    }
    const result = simulateWave(board, SMALL_WAVE);
    expect(result.defeated).toBe(3);
    expect(result.leaked).toBe(0);
    // 雑兵の reward は 10
    expect(result.rewardScore).toBe(30);
    // 撃破イベントが3回記録されている
    const defeats = result.ticks.flatMap((t) =>
      t.events.filter((e) => e.kind === 'defeat')
    );
    expect(defeats).toHaveLength(3);
  });

  it('openingDamage が敵HP以上ならスポーン時に全滅する', () => {
    const board = createBoard(PLAINS_MAP);
    const result = simulateWave(board, SMALL_WAVE, {
      openingDamage: 999,
      speedMultiplier: 1,
    });
    expect(result.defeated).toBe(3);
    expect(result.leaked).toBe(0);
  });

  it('speedMultiplier で減速すると突破に時間がかかる', () => {
    const board = createBoard(PLAINS_MAP);
    const normal = simulateWave(board, SMALL_WAVE, NO_MODIFIERS);
    const slowed = simulateWave(board, SMALL_WAVE, {
      openingDamage: 0,
      speedMultiplier: 0.5,
    });
    expect(slowed.ticks.length).toBeGreaterThan(normal.ticks.length);
  });

  it('落とし穴は最初に踏んだ敵を倒し使用回数を消費する', () => {
    const board = placeTrap(createBoard(PLAINS_MAP), 'pitfall', PLAINS_MAP.path[5]);
    const result = simulateWave(board, SMALL_WAVE);
    expect(result.defeated).toBe(1);
    expect(result.leaked).toBe(2);
    expect(result.trapUsesLeft).toEqual([0]);
  });

  it('敵スナップショットの座標は経路の範囲内にある', () => {
    const board = createBoard(PLAINS_MAP);
    const result = simulateWave(board, SMALL_WAVE);
    for (const tick of result.ticks) {
      for (const enemy of tick.enemies) {
        expect(enemy.x).toBeGreaterThanOrEqual(0);
        expect(enemy.x).toBeLessThan(PLAINS_MAP.width);
        expect(enemy.y).toBeGreaterThanOrEqual(0);
        expect(enemy.y).toBeLessThan(PLAINS_MAP.height);
      }
    }
  });

  it('タワーの発射周期はちょうど cooldownTicks tick になる', () => {
    // 重装（速度0.06）は射程内に長く留まるため、複数回の発射間隔を観測できる
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'arrow-tower',
      PLAINS_MAP.buildSlots[1]
    );
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 0 }],
    };
    const result = simulateWave(board, wave);
    const shotTicks = result.ticks
      .filter((t) => t.events.some((e) => e.kind === 'shot'))
      .map((t) => t.tick);

    // 十分な回数の発射が観測できていること（射程通過が速すぎない前提の確認）
    expect(shotTicks.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < shotTicks.length; i++) {
      expect(shotTicks[i] - shotTicks[i - 1]).toBe(8);
    }
  });

  it('射程を希少化した弓兵1基では重装1体を仕留めきれず漏らす', () => {
    // 射程1.6では覆える経路が局所化し、万能ではなくなる（空間パズルの前提）
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'arrow-tower',
      PLAINS_MAP.buildSlots[1] // (2,2)
    );
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 0 }],
    };
    const result = simulateWave(board, wave);
    expect(result.leaked).toBe(1);
    expect(result.defeated).toBe(0);
  });

  it('splashRadius を持つタワーは範囲内の複数の敵に同時ダメージを与える', () => {
    // 火砲台（splashRadius:1, damage:12）を1基設置し、密集した雑兵の群れを通過させる
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'cannon-tower',
      PLAINS_MAP.buildSlots[1]
    );
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 1 }],
    };
    const result = simulateWave(board, wave);

    const firstShotTick = result.ticks.find((t) =>
      t.events.some((e) => e.kind === 'shot')
    );
    expect(firstShotTick).toBeDefined();

    // 1回の発射（同一tick）で複数の敵のHPが最大値未満まで減っていれば
    // 単体ではなく範囲ダメージが適用されたと判断できる
    const damagedEnemies = firstShotTick!.enemies.filter(
      (e) => e.hp < e.maxHp
    );
    expect(damagedEnemies.length).toBeGreaterThanOrEqual(2);
  });
});
