import { CpuAI } from './ai';
import { EntityFactory } from './entities';

describe('CpuAI Module', () => {
  it('should target puck when threatening goal', () => {
    const game = EntityFactory.createGameState();
    // Move puck to threatening position
    game.pucks[0].y = 200; // Upper half
    game.pucks[0].vy = -5; // Moving up
    game.pucks[0].x = 100;
    game.pucks[0].vx = 0;

    const diff = 'normal';
    const now = 1000;

    // Calculate once to set target
    const result = CpuAI.update(game, diff, now);

    // Expect target to be predicted puck position
    expect(result).not.toBeNull();
    expect(result?.cpuTarget).not.toBeNull();
    // Prediction logic: x + vx * factor. Factor is 4 for normal.
    // 100 + 0 * 4 = 100.
    expect(result?.cpuTarget?.x).toBe(100);
  });

  it('should return to home position if out of bounds', () => {
    const game = EntityFactory.createGameState();
    game.cpu.x = 10; // Out of bounds (< 50)

    const result = CpuAI.update(game, 'normal', 1000);

    // 不変更新パターン: 結果を検証
    expect(result).not.toBeNull();
    // Logic forces return to center-ish
    // We can verify calculateTarget logic returns center position.
    const target = CpuAI.calculateTarget(game, 'normal', 1000);
    expect(target.x).toBe(150); // W/2
    expect(target.y).toBe(80);
  });

  describe('スタック検出', () => {
    it('移動量が極小だとcpuStuckTimerが記録される', () => {
      const game = EntityFactory.createGameState();
      // CPUをターゲット到達済みの位置に配置（dist < 3 → 速度0）
      game.cpu.x = 120;
      game.cpu.y = 90;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      // ターゲットをCPU位置と同じに（到達済み）
      game.cpuTarget = { x: 120, y: 90 };
      game.cpuTargetTime = 950; // 最近設定
      game.cpuStuckTimer = 0;
      // パックを遠くに配置（脅威なし）
      game.pucks[0].x = 150;
      game.pucks[0].y = 400;
      game.pucks[0].vy = 2;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 1000);
      expect(result).not.toBeNull();
      // 移動量ほぼ0 → スタックタイマー開始
      expect(result!.cpuStuckTimer).toBe(1000);
    });

    it('2秒以上スタック後に中央にリセットされる', () => {
      const game = EntityFactory.createGameState();
      // CPUをターゲット到達済みの位置に配置
      game.cpu.x = 120;
      game.cpu.y = 90;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      // ターゲットをCPU位置と同じに
      game.cpuTarget = { x: 120, y: 90 };
      game.cpuTargetTime = 3050; // 最近設定
      // 2秒前からスタック開始
      game.cpuStuckTimer = 1000;
      // パックを遠くに配置
      game.pucks[0].x = 150;
      game.pucks[0].y = 400;
      game.pucks[0].vy = 2;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 3100);
      expect(result).not.toBeNull();
      if (result) {
        // 中央にリセットされる
        expect(result.cpu.x).toBe(150); // W/2
        expect(result.cpu.y).toBe(80);
        expect(result.cpuStuckTimer).toBe(0);
      }
    });

    it('移動中はスタックタイマーがリセットされる', () => {
      const game = EntityFactory.createGameState();
      // CPUをターゲットから離れた位置に配置（移動中）
      game.cpu.x = 100;
      game.cpu.y = 80;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      game.cpuStuckTimer = 1000; // タイマー開始済み
      // パックがCPUゴールに向かっている
      game.pucks[0].x = 200;
      game.pucks[0].y = 200;
      game.pucks[0].vy = -5;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 2000);
      expect(result).not.toBeNull();
      // CPUはパックを追って移動するのでタイマーリセット
      expect(result!.cpuStuckTimer).toBe(0);
    });
  });
});
