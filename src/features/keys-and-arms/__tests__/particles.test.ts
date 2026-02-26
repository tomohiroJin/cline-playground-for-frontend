/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — パーティクル・ポップアップテスト
 */
import { createParticles } from '../core/particles';

/** Canvas 2D コンテキストのモック */
function createMockCtx() {
  return {
    fillStyle: '',
    globalAlpha: 1,
    fillRect: jest.fn(),
    font: '',
    textAlign: '',
    textBaseline: '',
    fillText: jest.fn(),
  };
}

/** 描画ヘルパーのモック */
function createMockDraw(ctx) {
  return {
    $: ctx,
    txt: jest.fn(),
  };
}

describe('Particles', () => {
  let ctx;
  let draw;
  let particles;

  beforeEach(() => {
    ctx = createMockCtx();
    draw = createMockDraw(ctx);
    particles = createParticles(draw);
  });

  describe('spawn', () => {
    it('プールにパーティクルを追加する', () => {
      const pool = [];
      particles.Particles.spawn(pool, { x: 100, y: 100, n: 4 });
      expect(pool).toHaveLength(4);
    });

    it('パラメータが正しく設定される', () => {
      const pool = [];
      particles.Particles.spawn(pool, {
        x: 50, y: 60, n: 1, vxSpread: 0, vySpread: 0, vyBase: -1, life: 20, s: 5,
      });
      expect(pool).toHaveLength(1);
      const p = pool[0];
      expect(p.life).toBe(20);
      expect(p.maxLife).toBe(20);
      expect(p.s).toBe(5);
    });

    it('デフォルトの生成数は4', () => {
      const pool = [];
      particles.Particles.spawn(pool, { x: 0, y: 0 });
      expect(pool).toHaveLength(4);
    });

    it('プールを返す', () => {
      const pool = [];
      const result = particles.Particles.spawn(pool, { x: 0, y: 0 });
      expect(result).toBe(pool);
    });
  });

  describe('updateAndDraw', () => {
    it('ライフが減少する', () => {
      const pool = [];
      particles.Particles.spawn(pool, { x: 0, y: 0, n: 1, life: 10, vxSpread: 0, vySpread: 0 });
      const initialLife = pool[0].life;
      particles.Particles.updateAndDraw(pool);
      expect(pool[0].life).toBe(initialLife - 1);
    });

    it('座標が更新される', () => {
      const pool = [{ x: 10, y: 20, vx: 1, vy: -1, life: 10, maxLife: 10, s: 3, gravity: 0 }];
      particles.Particles.updateAndDraw(pool);
      expect(pool[0].x).toBe(11);
      expect(pool[0].y).toBe(19);
    });

    it('ライフ切れで削除される', () => {
      const pool = [{ x: 0, y: 0, vx: 0, vy: 0, life: 1, maxLife: 10, s: 3, gravity: 0 }];
      particles.Particles.updateAndDraw(pool);
      expect(pool).toHaveLength(0);
    });

    it('重力が適用される', () => {
      const pool = [{ x: 0, y: 0, vx: 0, vy: 0, life: 10, maxLife: 10, s: 3, gravity: 0.5 }];
      particles.Particles.updateAndDraw(pool);
      expect(pool[0].vy).toBe(0.5);
    });
  });
});

describe('Popups', () => {
  let ctx;
  let draw;
  let particles;

  beforeEach(() => {
    ctx = createMockCtx();
    draw = createMockDraw(ctx);
    particles = createParticles(draw);
  });

  describe('add', () => {
    it('ポップアップを追加する', () => {
      particles.Popups.add(100, 200, '+300');
      expect(particles.Popups.pool).toHaveLength(1);
      expect(particles.Popups.pool[0].t).toBe('+300');
      expect(particles.Popups.pool[0].life).toBe(50);
    });
  });

  describe('clear', () => {
    it('ポップアップをすべてクリアする', () => {
      particles.Popups.add(100, 200, '+300');
      particles.Popups.add(200, 300, '+500');
      particles.Popups.clear();
      expect(particles.Popups.pool).toHaveLength(0);
    });
  });

  describe('updateAndDraw', () => {
    it('ライフが減少する', () => {
      particles.Popups.add(100, 200, '+300');
      const initialLife = particles.Popups.pool[0].life;
      particles.Popups.updateAndDraw();
      expect(particles.Popups.pool[0].life).toBe(initialLife - 1);
    });

    it('上昇移動する', () => {
      particles.Popups.add(100, 200, '+300');
      const initialY = particles.Popups.pool[0].y;
      particles.Popups.updateAndDraw();
      expect(particles.Popups.pool[0].y).toBeLessThan(initialY);
    });

    it('ライフ切れで削除される', () => {
      particles.Popups.add(100, 200, '+300');
      particles.Popups.pool[0].life = 1;
      particles.Popups.updateAndDraw();
      expect(particles.Popups.pool).toHaveLength(0);
    });
  });
});
