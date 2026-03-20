/**
 * CanvasRenderer（Facade）テスト
 * - GameRendererPort インターフェースを満たすこと
 * - 各サブレンダラーへの委譲が正しく行われること
 */
import { CanvasRenderer } from './canvas-renderer';
import type { GameRendererPort } from '../../domain/contracts/renderer';
import { CONSTANTS } from '../../core/constants';

/** Canvas 2D コンテキストのモック */
function createMockContext(): CanvasRenderingContext2D {
  const methods = [
    'fillRect', 'strokeRect', 'clearRect',
    'beginPath', 'closePath', 'moveTo', 'lineTo',
    'arc', 'ellipse', 'fill', 'stroke',
    'fillText', 'measureText',
    'save', 'restore', 'translate', 'scale',
    'createLinearGradient', 'createRadialGradient',
    'roundRect',
  ] as const;

  const ctx: Record<string, unknown> = {};

  for (const method of methods) {
    if (method === 'measureText') {
      ctx[method] = jest.fn().mockReturnValue({ width: 100 });
    } else if (method === 'createLinearGradient' || method === 'createRadialGradient') {
      ctx[method] = jest.fn().mockReturnValue({
        addColorStop: jest.fn(),
      });
    } else {
      ctx[method] = jest.fn();
    }
  }

  // プロパティ
  ctx.fillStyle = '';
  ctx.strokeStyle = '';
  ctx.lineWidth = 0;
  ctx.shadowColor = '';
  ctx.shadowBlur = 0;
  ctx.font = '';
  ctx.textAlign = '';
  ctx.textBaseline = '';
  ctx.globalAlpha = 1;

  return ctx as unknown as CanvasRenderingContext2D;
}

describe('CanvasRenderer', () => {
  let ctx: CanvasRenderingContext2D;
  let renderer: GameRendererPort;

  beforeEach(() => {
    ctx = createMockContext();
    renderer = new CanvasRenderer(ctx, CONSTANTS);
  });

  it('GameRendererPort インターフェースを満たす', () => {
    expect(renderer).toBeDefined();
    expect(typeof renderer.clear).toBe('function');
    expect(typeof renderer.drawField).toBe('function');
    expect(typeof renderer.drawPuck).toBe('function');
    expect(typeof renderer.drawMallet).toBe('function');
    expect(typeof renderer.drawItem).toBe('function');
    expect(typeof renderer.drawEffectZones).toBe('function');
    expect(typeof renderer.drawParticles).toBe('function');
    expect(typeof renderer.drawCountdown).toBe('function');
    expect(typeof renderer.drawPauseOverlay).toBe('function');
    expect(typeof renderer.drawCombo).toBe('function');
    expect(typeof renderer.drawHUD).toBe('function');
    expect(typeof renderer.drawHelp).toBe('function');
    expect(typeof renderer.drawShockwave).toBe('function');
    expect(typeof renderer.drawVignette).toBe('function');
    expect(typeof renderer.drawShield).toBe('function');
    expect(typeof renderer.drawMagnetEffect).toBe('function');
    expect(typeof renderer.drawReaction).toBe('function');
  });

  describe('clear', () => {
    it('Canvas を塗りつぶす', () => {
      renderer.clear(0);
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('drawField', () => {
    it('フィールドを描画する', () => {
      const field = {
        id: 'classic',
        name: 'Classic',
        goalSize: 120,
        color: '#00d4ff',
        obstacles: [],
        destructible: false,
        obstacleHp: 0,
        obstacleRespawnMs: 0,
      };
      renderer.drawField(field, [], 0);
      // フィールド描画で strokeRect が呼ばれる（外枠）
      expect(ctx.strokeRect).toHaveBeenCalled();
    });
  });

  describe('drawPuck', () => {
    it('可視パックを描画する', () => {
      const puck = { x: 225, y: 450, vx: 0, vy: 0, radius: 21, visible: true, invisibleCount: 0, hitCount: 0, trail: [] };
      renderer.drawPuck(puck);
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('不可視パックは描画しない', () => {
      const arcBefore = (ctx.arc as jest.Mock).mock.calls.length;
      const puck = { x: 225, y: 450, vx: 0, vy: 0, radius: 21, visible: false, invisibleCount: 0, hitCount: 0, trail: [] };
      renderer.drawPuck(puck);
      expect((ctx.arc as jest.Mock).mock.calls.length).toBe(arcBefore);
    });
  });

  describe('drawMallet', () => {
    it('マレットを描画する', () => {
      const mallet = { x: 225, y: 750, vx: 0, vy: 0 };
      renderer.drawMallet(mallet, '#3366ff', false);
      expect(ctx.arc).toHaveBeenCalled();
    });
  });

  describe('drawCountdown', () => {
    it('カウントダウン数字を描画する', () => {
      renderer.drawCountdown(3, 500);
      expect(ctx.fillText).toHaveBeenCalledWith('3', 0, 0);
    });

    it('GO! を描画する', () => {
      renderer.drawCountdown(0, 500);
      expect(ctx.fillText).toHaveBeenCalledWith('GO!', 0, 0);
    });
  });

  describe('drawParticles', () => {
    it('パーティクルを描画する', () => {
      const particles = [
        { x: 100, y: 200, vx: 1, vy: 1, size: 5, color: 'rgb(255, 0, 0)', life: 30, maxLife: 60 },
      ];
      renderer.drawParticles(particles);
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('空のパーティクル配列でもエラーにならない', () => {
      expect(() => renderer.drawParticles([])).not.toThrow();
    });
  });

  describe('drawPauseOverlay', () => {
    it('ポーズ画面を描画する', () => {
      renderer.drawPauseOverlay();
      expect(ctx.fillText).toHaveBeenCalledWith('PAUSED', expect.any(Number), expect.any(Number));
    });
  });

  describe('drawCombo', () => {
    it('コンボ2以上でコンボ表示を描画する', () => {
      renderer.drawCombo({ count: 3, lastScorer: undefined }, 1000);
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('コンボ1以下では描画しない', () => {
      const fillTextBefore = (ctx.fillText as jest.Mock).mock.calls.length;
      renderer.drawCombo({ count: 1, lastScorer: undefined }, 1000);
      expect((ctx.fillText as jest.Mock).mock.calls.length).toBe(fillTextBefore);
    });
  });

  describe('drawShockwave', () => {
    it('アクティブな衝撃波を描画する', () => {
      renderer.drawShockwave({
        active: true,
        impactX: 225,
        impactY: 450,
        shockwaveRadius: 10,
        shockwaveMaxRadius: 50,
        framesRemaining: 10,
      });
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('非アクティブな衝撃波は描画しない', () => {
      const arcBefore = (ctx.arc as jest.Mock).mock.calls.length;
      renderer.drawShockwave({
        active: false,
        impactX: 0,
        impactY: 0,
        shockwaveRadius: 0,
        shockwaveMaxRadius: 0,
        framesRemaining: 0,
      });
      expect((ctx.arc as jest.Mock).mock.calls.length).toBe(arcBefore);
    });
  });

  describe('drawItem', () => {
    it('アイテムを描画してもエラーにならない', () => {
      const item = {
        id: 'split' as const,
        name: 'Split',
        color: '#FF6B6B',
        icon: '◆',
        x: 200,
        y: 300,
        vx: 0,
        vy: 0,
        r: 24,
      };
      expect(() => renderer.drawItem(item, 1000)).not.toThrow();
    });
  });

  describe('drawEffectZones', () => {
    it('エフェクトゾーンを描画してもエラーにならない', () => {
      const effects = {
        playerEffects: {},
        cpuEffects: {},
        fieldEffect: null,
      };
      expect(() => renderer.drawEffectZones(effects as never, 1000)).not.toThrow();
    });
  });

  describe('drawVignette', () => {
    it('ビネットエフェクトを描画する', () => {
      expect(() => renderer.drawVignette(0.5)).not.toThrow();
      expect(ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('drawShield', () => {
    it('プレイヤー側のシールドを描画する', () => {
      expect(() => renderer.drawShield(true, 120)).not.toThrow();
    });

    it('CPU 側のシールドを描画する', () => {
      expect(() => renderer.drawShield(false, 120)).not.toThrow();
    });
  });

  describe('drawMagnetEffect', () => {
    it('マグネットエフェクトを描画する', () => {
      const mallet = { x: 225, y: 750, vx: 0, vy: 0 };
      expect(() => renderer.drawMagnetEffect(mallet, 1000)).not.toThrow();
    });
  });

  describe('drawReaction', () => {
    it('プレイヤー側のリアクションを描画する', () => {
      expect(() => renderer.drawReaction('Nice!', 'player', 500)).not.toThrow();
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('CPU 側のリアクションを描画する', () => {
      expect(() => renderer.drawReaction('Oh no!', 'cpu', 500)).not.toThrow();
    });
  });

  describe('drawHUD', () => {
    it('HUD を描画してもエラーにならない', () => {
      // Arrange: drawHUD は effects.player を参照するため正しい構造を渡す
      const effects = {
        player: { speed: null, invisible: 0 },
        cpu: { speed: null, invisible: 0 },
      };
      expect(() => renderer.drawHUD(effects as never, 1000)).not.toThrow();
    });
  });

  describe('drawHelp', () => {
    it('ヘルプをフィールド指定なしで描画する', () => {
      expect(() => renderer.drawHelp()).not.toThrow();
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('ヘルプをフィールド指定ありで描画する', () => {
      const field = {
        id: 'classic',
        name: 'Classic',
        goalSize: 120,
        color: '#00d4ff',
        obstacles: [],
        destructible: false,
        obstacleHp: 0,
        obstacleRespawnMs: 0,
      };
      expect(() => renderer.drawHelp(field)).not.toThrow();
    });
  });
});
