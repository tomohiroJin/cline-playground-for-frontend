import { PLAINS_MAP } from '../board/stage-map';
import { createBoard, placeTower, placeTrap } from '../board/board-state';
import {
  simulateWave,
  NO_MODIFIERS,
  HIGH_GROUND_DAMAGE_MULT,
} from './simulate-wave';
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

  it('滞留セルを通る敵は到達に多くの tick を要する', () => {
    // 中央3セルを滞留にした直線マップで、有り/無しの突破 tick を比較
    const base = {
      id: 'test-line',
      name: 'テスト直線',
      width: 8,
      height: 1,
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 5, y: 0 },
        { x: 6, y: 0 },
        { x: 7, y: 0 },
      ],
      buildSlots: [],
    };
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const normal = simulateWave(createBoard(base), wave);
    const slowed = simulateWave(
      createBoard({ ...base, slowCells: [{ x: 3, y: 0 }, { x: 4, y: 0 }] }),
      wave
    );
    expect(slowed.ticks.length).toBeGreaterThan(normal.ticks.length);
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

  it('高台に置いた弓兵は通常スロットより早く敵を撃破する', () => {
    const line = {
      id: 'test-hg',
      name: 'テスト高台',
      width: 6,
      height: 3,
      path: [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 5, y: 1 },
      ],
      buildSlots: [{ x: 2, y: 0 }],
    };
    // 雑兵（HP20）を対象にする: 重装（HP60）だと現行の射程1.6/威力6では
    // 高台補正込みでも射程内の滞在時間中に撃破しきれず両者とも取り漏らしてしまい
    // 「高台の方が早く倒す」という比較が成立しないため
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const normalBoard = placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 0 });
    const highBoard = placeTower(
      createBoard({ ...line, highGround: [{ x: 2, y: 0 }] }),
      'arrow-tower',
      { x: 2, y: 0 }
    );
    const defeatTick = (r: ReturnType<typeof simulateWave>) =>
      r.ticks.find((t) => t.events.some((e) => e.kind === 'defeat'))?.tick;
    const normalTick = defeatTick(simulateWave(normalBoard, wave));
    const highTick = defeatTick(simulateWave(highBoard, wave));
    expect(normalTick).toBeDefined();
    expect(highTick).toBeDefined();
    expect(highTick!).toBeLessThan(normalTick!);
  });

  it('かがり火は自身では攻撃しない', () => {
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'beacon',
      PLAINS_MAP.buildSlots[1]
    );
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const result = simulateWave(board, wave);
    expect(result.defeated).toBe(0);
    expect(result.leaked).toBe(1);
  });

  it('かがり火に隣接する弓兵は火力が上がり早く撃破する', () => {
    const line = {
      id: 'test-beacon',
      name: 'テスト篝火',
      width: 6,
      height: 3,
      path: [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 5, y: 1 },
      ],
      // (2,0) と (3,0) は隣接（Chebyshev=1）
      buildSlots: [{ x: 2, y: 0 }, { x: 3, y: 0 }],
    };
    // 雑兵（HP20）を対象にする: 重装（HP60）だと現行の射程1.6/威力6では
    // 隣接強化込みでも射程内の滞在時間中に撃破しきれず両者とも取り漏らしてしまい
    // 「隣接強化の方が早く倒す」という比較が成立しないため（高台テストと同じ理由）
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const soloBoard = placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 0 });
    const buffedBoard = placeTower(
      placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 0 }),
      'beacon',
      { x: 3, y: 0 }
    );
    const defeatTick = (r: ReturnType<typeof simulateWave>) =>
      r.ticks.find((t) => t.events.some((e) => e.kind === 'defeat'))?.tick;
    const soloTick = defeatTick(simulateWave(soloBoard, wave));
    const buffedTick = defeatTick(simulateWave(buffedBoard, wave));
    expect(soloTick).toBeDefined();
    expect(buffedTick).toBeDefined();
    expect(buffedTick!).toBeLessThan(soloTick!);
  });

  it('towerAttackMultiplier は高台補正と二重適用されず式通りに合成される', () => {
    // 高台(x1.3) × towerAttackMultiplier(x1.5、鍛冶の加護相当) の複合。
    // 二重適用になっていなければ、1発目の与ダメージは
    // round(damage × 1.3 × 1.5 × (1+0)) と厳密に一致するはず
    const line = {
      id: 'test-mult',
      name: 'テスト倍率合成',
      width: 6,
      height: 3,
      path: [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 5, y: 1 },
      ],
      buildSlots: [{ x: 2, y: 0 }],
      highGround: [{ x: 2, y: 0 }],
    };
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const baseBoard = placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 0 });
    // createBoard 後にオブジェクトをスプレッドして towerAttackMultiplier を直接上書きする
    const board = { ...baseBoard, towerAttackMultiplier: 1.5 };

    const result = simulateWave(board, wave);
    const firstShotTick = result.ticks.find((t) =>
      t.events.some((e) => e.kind === 'shot')
    );
    expect(firstShotTick).toBeDefined();
    const shotEvent = firstShotTick!.events.find((e) => e.kind === 'shot');
    expect(shotEvent).toBeDefined();
    const targetIndex = (shotEvent as { targetIndex: number }).targetIndex;
    const targetSnapshot = firstShotTick!.enemies.find(
      (e) => e.index === targetIndex
    );
    expect(targetSnapshot).toBeDefined();

    // 雑兵の HP は 20。式通りなら 20 - round(6 * 1.3 * 1.5) = 8 になる
    const expectedDamage = Math.round(6 * HIGH_GROUND_DAMAGE_MULT * 1.5);
    expect(targetSnapshot!.hp).toBe(20 - expectedDamage);
  });

  it('複数のかがり火が同一タワーに隣接するとΣ加算合成される', () => {
    // かがり火1基(+0.25)と3基(+0.25×3=+0.75)を比較する。
    // Σ加算合成なら round(6×1.75)=11、
    // もし誤って乗算合成 Π(1+b) になっていた場合は round(6×1.25³)=round(11.719)=12 となり、
    // 丸め後の値が 11 ≠ 12 で必ず乖離する入力を選ぶことで、
    // 「加算合成であり乗算合成ではない」ことを実測ダメージの厳密一致で判別する
    // （2基版は round(6×1.5)=9 と round(6×1.25²)=round(9.375)=9 が丸め後に一致してしまい判別不能だった）。
    const line = {
      id: 'test-beacon-multi',
      name: 'テスト篝火複数',
      width: 6,
      height: 4,
      path: [
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
      ],
      // (2,1) の弓兵に対して (1,0)・(2,0)・(3,0) はいずれも隣接（Chebyshev=1）
      buildSlots: [
        { x: 2, y: 1 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
    };
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const singleBeaconBoard = placeTower(
      placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 1 }),
      'beacon',
      { x: 2, y: 0 }
    );
    const tripleBeaconBoard = placeTower(
      placeTower(
        placeTower(
          placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 1 }),
          'beacon',
          { x: 1, y: 0 }
        ),
        'beacon',
        { x: 2, y: 0 }
      ),
      'beacon',
      { x: 3, y: 0 }
    );

    const firstShotDamage = (r: ReturnType<typeof simulateWave>): number => {
      const firstShotTick = r.ticks.find((t) =>
        t.events.some((e) => e.kind === 'shot')
      );
      const shotEvent = firstShotTick?.events.find((e) => e.kind === 'shot');
      const targetIndex = (shotEvent as { targetIndex: number }).targetIndex;
      const targetSnapshot = firstShotTick?.enemies.find(
        (e) => e.index === targetIndex
      );
      // 雑兵の HP は 20。撃破していれば消滅しているのでその場合はダメージ量=20扱い
      return targetSnapshot ? 20 - targetSnapshot.hp : 20;
    };

    const singleDamage = firstShotDamage(simulateWave(singleBeaconBoard, wave));
    const tripleDamage = firstShotDamage(simulateWave(tripleBeaconBoard, wave));
    expect(singleDamage).toBe(Math.round(6 * 1.25));
    // Σ加算合成の厳密値（11）をアサート。乗算合成なら12になり、ここで必ず失敗する
    expect(tripleDamage).toBe(11);
    expect(tripleDamage).toBeGreaterThan(singleDamage);
  });
});
