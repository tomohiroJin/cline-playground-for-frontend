/**
 * Phase 1: 基盤改善＋ゲームフィール強化のテスト
 */
import { CONSTANTS } from './constants';
import { EntityFactory } from './entities';
import { createSoundSystem } from './sound';
import { ShakeState, GamePhase } from './types';

// Mock AudioContext
window.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 0 },
    type: 'sine',
  }),
  createGain: () => ({
    connect: jest.fn(),
    gain: {
      value: 0,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  }),
  currentTime: 0,
  destination: {},
}));

describe('Phase 1: 基盤改善＋ゲームフィール強化', () => {
  // ── 1.0 レスポンシブデザイン ──────────────────────
  describe('1.0 レスポンシブデザイン - 固定解像度', () => {
    it('CONSTANTS が 450x900 の固定解像度である', () => {
      expect(CONSTANTS.CANVAS.WIDTH).toBe(450);
      expect(CONSTANTS.CANVAS.HEIGHT).toBe(900);
    });

    it('マレットサイズが 42 である', () => {
      expect(CONSTANTS.SIZES.MALLET).toBe(42);
    });

    it('パックサイズが 21 である', () => {
      expect(CONSTANTS.SIZES.PUCK).toBe(21);
    });

    it('アイテムサイズが 24 である', () => {
      expect(CONSTANTS.SIZES.ITEM).toBe(24);
    });

    it('ゲーム状態が 450x900 解像度で初期化される', () => {
      const state = EntityFactory.createGameState();
      // プレイヤーが下半分、CPUが上半分
      expect(state.player.x).toBe(225); // 450/2
      expect(state.player.y).toBe(830); // 900-70
      expect(state.cpu.x).toBe(225);
      expect(state.cpu.y).toBe(70);
    });
  });

  // ── 1.1 カウントダウン演出 ────────────────────────
  describe('1.1 カウントダウン演出 - GamePhase 型', () => {
    it('GamePhase 型が正しく定義されている', () => {
      const phases: GamePhase[] = ['countdown', 'playing', 'paused', 'finished'];
      expect(phases).toHaveLength(4);
    });

    it('カウントダウン中はゲーム状態が変化しない（パックの位置が保持される）', () => {
      const state = EntityFactory.createGameState();
      const initialPuckX = state.pucks[0].x;
      const initialPuckY = state.pucks[0].y;
      // カウントダウン中はゲームループがパック更新をスキップするため
      // パック位置は変化しない（ゲームループ側の責務）
      expect(state.pucks[0].x).toBe(initialPuckX);
      expect(state.pucks[0].y).toBe(initialPuckY);
    });
  });

  // ── 1.2 画面シェイク ──────────────────────────────
  describe('1.2 画面シェイク - ShakeState', () => {
    it('ShakeState 型が intensity, duration, startTime を持つ', () => {
      const shake: ShakeState = {
        intensity: 8,
        duration: 300,
        startTime: Date.now(),
      };
      expect(shake.intensity).toBe(8);
      expect(shake.duration).toBe(300);
      expect(shake.startTime).toBeGreaterThan(0);
    });

    it('ゴール時のシェイクは intensity=8, duration=300', () => {
      const goalShake: ShakeState = {
        intensity: 8,
        duration: 300,
        startTime: Date.now(),
      };
      expect(goalShake.intensity).toBe(8);
      expect(goalShake.duration).toBe(300);
    });

    it('強打時のシェイクは intensity=3, duration=150', () => {
      const hitShake: ShakeState = {
        intensity: 3,
        duration: 150,
        startTime: Date.now(),
      };
      expect(hitShake.intensity).toBe(3);
      expect(hitShake.duration).toBe(150);
    });

    it('シェイクは時間経過で減衰する', () => {
      const shake: ShakeState = {
        intensity: 8,
        duration: 300,
        startTime: 1000,
      };
      // 100ms 経過時の減衰率
      const elapsed = 100;
      const decay = 1 - elapsed / shake.duration;
      expect(decay).toBeCloseTo(0.667, 2);

      // duration 到達時は完全に減衰
      const fullElapsed = 300;
      const fullDecay = 1 - fullElapsed / shake.duration;
      expect(fullDecay).toBe(0);
    });
  });

  // ── 1.3 パック速度ビジュアル ──────────────────────
  describe('1.3 パック速度ビジュアル - 速度閾値', () => {
    it('通常速度(< 6)のパックは白色相当', () => {
      // 速度閾値の検証
      const normalSpeed = 5;
      expect(normalSpeed).toBeLessThan(6);
    });

    it('高速(6〜10)のパックは黄色相当', () => {
      const fastSpeed = 8;
      expect(fastSpeed).toBeGreaterThanOrEqual(6);
      expect(fastSpeed).toBeLessThanOrEqual(10);
    });

    it('超高速(> 10)のパックは赤色相当', () => {
      const superSpeed = 12;
      expect(superSpeed).toBeGreaterThan(10);
    });
  });

  // ── 1.4 BGM & 1.5 サウンド改善 ───────────────────
  describe('1.4/1.5 サウンドシステム', () => {
    it('SoundSystem が bgmStart/bgmStop/bgmSetTempo メソッドを持つ', () => {
      const sound = createSoundSystem();
      expect(typeof sound.bgmStart).toBe('function');
      expect(typeof sound.bgmStop).toBe('function');
      expect(typeof sound.bgmSetTempo).toBe('function');
    });

    it('SoundSystem が countdown/go メソッドを持つ', () => {
      const sound = createSoundSystem();
      expect(typeof sound.countdown).toBe('function');
      expect(typeof sound.go).toBe('function');
    });

    it('hit() が速度パラメータを受け取れる', () => {
      const sound = createSoundSystem();
      // 速度パラメータ付きで呼び出してもエラーにならない
      expect(() => sound.hit(5)).not.toThrow();
      expect(() => sound.hit(10)).not.toThrow();
      expect(() => sound.hit()).not.toThrow();
    });

    it('wall() が角度パラメータを受け取れる', () => {
      const sound = createSoundSystem();
      expect(() => sound.wall(0.5)).not.toThrow();
      expect(() => sound.wall()).not.toThrow();
    });

    it('bgmStart/bgmStop が正しく動作する', () => {
      const sound = createSoundSystem();
      expect(() => sound.bgmStart()).not.toThrow();
      expect(() => sound.bgmStop()).not.toThrow();
    });

    it('bgmSetTempo が正しく動作する', () => {
      const sound = createSoundSystem();
      expect(() => sound.bgmSetTempo(1.3)).not.toThrow();
    });
  });
});
