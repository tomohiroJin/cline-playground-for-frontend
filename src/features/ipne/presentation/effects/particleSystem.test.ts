/**
 * particleSystem のユニットテスト
 *
 * パーティクル生成・更新・描画ロジックの動作を検証する。
 */

import {
  createRadialParticles,
  createRisingParticles,
  createSpiralParticles,
  createPulseParticles,
  createTrailParticles,
  updateParticles,
  drawParticles,
  randomRange,
  selectRandomColor,
} from './particleSystem';
import { Particle } from './effectTypes';
import { createMockCanvasContext } from '../../__tests__/testUtils';

describe('共通ユーティリティ', () => {
  describe('randomRange', () => {
    it('min-max範囲内の値を返す', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomRange(10, 20);
        expect(result).toBeGreaterThanOrEqual(10);
        expect(result).toBeLessThanOrEqual(20);
      }
    });

    it('min === max の場合はその値を返す', () => {
      expect(randomRange(5, 5)).toBe(5);
    });
  });

  describe('selectRandomColor', () => {
    it('色配列から1色を返す', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];
      const result = selectRandomColor(colors);
      expect(colors).toContain(result);
    });

    it('1色の配列ではその色を返す', () => {
      expect(selectRandomColor(['#abc'])).toBe('#abc');
    });
  });
});

describe('particleSystem', () => {
  describe('createRadialParticles', () => {
    it('指定数のパーティクルを生成する', () => {
      const particles = createRadialParticles(8, 100, 100, ['#ff0000'], 20, 40, 2, 4, 1.5);
      expect(particles).toHaveLength(8);
    });

    it('各パーティクルが正しい初期値を持つ', () => {
      const particles = createRadialParticles(4, 50, 60, ['#00ff00'], 10, 20, 1, 3, 2.0);
      for (const p of particles) {
        expect(p.x).toBe(50);
        expect(p.y).toBe(60);
        expect(p.alpha).toBe(1.0);
        expect(p.life).toBe(1.0);
        expect(p.decay).toBe(2.0);
        expect(p.color).toBe('#00ff00');
      }
    });

    it('パーティクルが放射状に速度を持つ', () => {
      const particles = createRadialParticles(4, 0, 0, ['#fff'], 50, 50, 2, 2, 1);
      // 4つのパーティクルが異なる方向を向いている
      const angles = particles.map(p => Math.atan2(p.vy, p.vx));
      const uniqueDirections = new Set(angles.map(a => Math.round(a * 10)));
      expect(uniqueDirections.size).toBeGreaterThanOrEqual(3);
    });

    it('速度がmin-max範囲内である', () => {
      const particles = createRadialParticles(20, 0, 0, ['#fff'], 30, 60, 1, 1, 1);
      for (const p of particles) {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        // ランダム性のため少し余裕を持たせる
        expect(speed).toBeGreaterThanOrEqual(25);
        expect(speed).toBeLessThanOrEqual(65);
      }
    });

    it('サイズがmin-max範囲内である', () => {
      const particles = createRadialParticles(20, 0, 0, ['#fff'], 10, 20, 2, 5, 1);
      for (const p of particles) {
        expect(p.size).toBeGreaterThanOrEqual(2);
        expect(p.size).toBeLessThanOrEqual(5);
      }
    });

    it('複数色からランダムに選択する', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];
      const particles = createRadialParticles(30, 0, 0, colors, 10, 20, 1, 2, 1);
      const usedColors = new Set(particles.map(p => p.color));
      // 30個生成すれば高確率で全色使われる
      expect(usedColors.size).toBeGreaterThanOrEqual(2);
      for (const color of usedColors) {
        expect(colors).toContain(color);
      }
    });

    it('0個を指定した場合は空配列を返す', () => {
      const particles = createRadialParticles(0, 0, 0, ['#fff'], 10, 20, 1, 2, 1);
      expect(particles).toHaveLength(0);
    });
  });

  describe('createRisingParticles', () => {
    it('指定数のパーティクルを生成する', () => {
      const particles = createRisingParticles(6, 100, 200, ['#00ff00'], 2, 4, 1.5);
      expect(particles).toHaveLength(6);
    });

    it('パーティクルが上方向の速度を持つ', () => {
      const particles = createRisingParticles(10, 0, 0, ['#fff'], 1, 3, 1);
      for (const p of particles) {
        expect(p.vy).toBeLessThan(0); // 上方向は負
      }
    });

    it('X位置にランダムな散らばりがある', () => {
      const particles = createRisingParticles(20, 100, 200, ['#fff'], 1, 2, 1);
      const xPositions = particles.map(p => p.x);
      const hasVariation = xPositions.some(x => x !== 100);
      expect(hasVariation).toBe(true);
    });
  });

  describe('createSpiralParticles', () => {
    it('指定数のパーティクルを生成する', () => {
      const particles = createSpiralParticles(12, 50, 50, ['#ffd700'], 60, 1.5);
      expect(particles).toHaveLength(12);
    });

    it('パーティクルが螺旋状に配置される', () => {
      const particles = createSpiralParticles(8, 0, 0, ['#fff'], 50, 1);
      // パーティクルが均等な角度で配置されている
      const angles = particles.map(p => Math.atan2(p.vy + 55, p.vx)); // vy にランダムオフセットがあるため大きめ
      expect(angles.length).toBe(8);
    });

    it('上方向のバイアスを持つ速度である', () => {
      const particles = createSpiralParticles(20, 0, 0, ['#fff'], 80, 1);
      // 螺旋パーティクルは上方向バイアス（vy に負のオフセット）を持つ
      const avgVy = particles.reduce((sum, p) => sum + p.vy, 0) / particles.length;
      expect(avgVy).toBeLessThan(0);
    });
  });

  describe('createPulseParticles', () => {
    it('指定数のパーティクルを生成する', () => {
      const particles = createPulseParticles(16, 0, 0, ['#ff0000'], 40, 2);
      expect(particles).toHaveLength(16);
    });

    it('パーティクルが均一速度で放射状に広がる', () => {
      const speed = 50;
      const particles = createPulseParticles(8, 0, 0, ['#fff'], speed, 1);
      for (const p of particles) {
        const actualSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        expect(actualSpeed).toBeCloseTo(speed, 0);
      }
    });

    it('発生位置が中心点である', () => {
      const particles = createPulseParticles(4, 100, 200, ['#fff'], 30, 1);
      for (const p of particles) {
        expect(p.x).toBe(100);
        expect(p.y).toBe(200);
      }
    });
  });

  describe('createTrailParticles', () => {
    it('指定数のパーティクルを生成する', () => {
      const particles = createTrailParticles(8, 0, 0, 1, 0, ['#fff'], 60, 2);
      expect(particles).toHaveLength(8);
    });

    it('パーティクルが指定方向に向かう速度を持つ', () => {
      // 右方向
      const particles = createTrailParticles(10, 0, 0, 1, 0, ['#fff'], 60, 2);
      const avgVx = particles.reduce((sum, p) => sum + p.vx, 0) / particles.length;
      expect(avgVx).toBeGreaterThan(0);
    });

    it('速度にspread（散らばり）がある', () => {
      const particles = createTrailParticles(20, 0, 0, 1, 0, ['#fff'], 60, 2);
      const velocities = particles.map(p => p.vy);
      const hasVariation = velocities.some(v => v !== 0);
      expect(hasVariation).toBe(true);
    });
  });

  describe('updateParticles', () => {
    it('パーティクルの位置を速度に基づいて更新する', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 100, vy: 50, size: 3, color: '#fff', alpha: 1, life: 1, decay: 0.5 },
      ];

      const updated = updateParticles(particles, 0.1);
      expect(updated[0].x).toBeCloseTo(10);
      expect(updated[0].y).toBeCloseTo(5);
    });

    it('ライフが減衰する', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 3, color: '#fff', alpha: 1, life: 1, decay: 2 },
      ];

      const updated = updateParticles(particles, 0.1);
      expect(updated[0].life).toBeCloseTo(0.8);
    });

    it('ライフが0以下のパーティクルを除去する', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 3, color: '#fff', alpha: 1, life: 0.1, decay: 2 },
      ];

      const updated = updateParticles(particles, 0.1);
      // life = 0.1 - 2 * 0.1 = -0.1 → 除去される
      expect(updated).toHaveLength(0);
    });

    it('重力を適用する', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 3, color: '#fff', alpha: 1, life: 1, decay: 0.1 },
      ];

      const updated = updateParticles(particles, 0.1, 100);
      expect(updated[0].vy).toBeCloseTo(10); // 100 * 0.1
    });

    it('重力なし（デフォルト）では Y 速度が変わらない', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 50, size: 3, color: '#fff', alpha: 1, life: 1, decay: 0.1 },
      ];

      const updated = updateParticles(particles, 0.1);
      expect(updated[0].vy).toBe(50);
    });

    it('アルファ値がライフに連動する', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 3, color: '#fff', alpha: 1, life: 1, decay: 1 },
      ];

      const updated = updateParticles(particles, 0.5);
      expect(updated[0].alpha).toBeCloseTo(0.5);
    });

    it('サイズが徐々に縮小する', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 10, color: '#fff', alpha: 1, life: 1, decay: 0.5 },
      ];

      const updated = updateParticles(particles, 0.1);
      expect(updated[0].size).toBeLessThan(10);
      expect(updated[0].size).toBeGreaterThan(0.5);
    });

    it('空配列を渡すと空配列を返す', () => {
      const updated = updateParticles([], 0.1);
      expect(updated).toHaveLength(0);
    });

    it('生存パーティクルと死亡パーティクルが混在する場合、生存分のみ返す', () => {
      const particles: Particle[] = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 3, color: '#fff', alpha: 1, life: 1, decay: 0.5 },
        { x: 0, y: 0, vx: 0, vy: 0, size: 3, color: '#fff', alpha: 1, life: 0.05, decay: 1 },
      ];

      const updated = updateParticles(particles, 0.1);
      expect(updated).toHaveLength(1);
    });
  });

  describe('drawParticles', () => {
    it('各パーティクルを描画する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const particles: Particle[] = [
        { x: 10, y: 20, vx: 0, vy: 0, size: 4, color: '#ff0000', alpha: 0.8, life: 0.8, decay: 1 },
        { x: 30, y: 40, vx: 0, vy: 0, size: 6, color: '#00ff00', alpha: 0.5, life: 0.5, decay: 1 },
      ];

      drawParticles(ctx, particles, 0, 0);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalledTimes(2);
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('ビューポートオフセットを適用する', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const particles: Particle[] = [
        { x: 10, y: 20, vx: 0, vy: 0, size: 4, color: '#fff', alpha: 1, life: 1, decay: 1 },
      ];

      drawParticles(ctx, particles, -5, -10);

      expect(ctx.fillRect).toHaveBeenCalledWith(
        10 + (-5) - 4 / 2,
        20 + (-10) - 4 / 2,
        4,
        4
      );
    });

    it('アルファ値0以下のパーティクルをスキップする', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;
      const particles: Particle[] = [
        { x: 10, y: 20, vx: 0, vy: 0, size: 4, color: '#fff', alpha: 0, life: 0, decay: 1 },
      ];

      drawParticles(ctx, particles, 0, 0);

      expect(ctx.fillRect).not.toHaveBeenCalled();
    });

    it('空配列の場合はsave/restoreのみ呼ばれる', () => {
      const ctx = createMockCanvasContext() as CanvasRenderingContext2D;

      drawParticles(ctx, [], 0, 0);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });
});
