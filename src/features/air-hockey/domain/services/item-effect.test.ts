import {
  SplitEffect,
  SpeedEffect,
  InvisibleEffect,
  ShieldEffect,
  MagnetEffect,
  BigEffect,
  ItemEffectRegistry,
} from './item-effect';
import type { GameState } from '../../core/types';

describe('ItemEffect Strategy パターン', () => {
  const createGameState = (): GameState => ({
    player: { x: 225, y: 830, vx: 0, vy: 0 },
    cpu: { x: 225, y: 80, vx: 0, vy: 0 },
    pucks: [{ x: 225, y: 450, vx: 3, vy: -3, visible: true, invisibleCount: 0 }],
    items: [],
    effects: {
      player: { speed: null, invisible: 0, shield: false, magnet: null, big: null },
      cpu: { speed: null, invisible: 0, shield: false, magnet: null, big: null },
    },
    flash: null,
    goalEffect: null,
    lastItemSpawn: 0,
    cpuTarget: null,
    cpuTargetTime: 0,
    cpuStuckTimer: 0,
    fever: { active: false, lastGoalTime: 0, extraPucks: 0 },
    particles: [],
    obstacleStates: [],
    combo: { count: 0, lastScorer: undefined },
  });

  describe('SplitEffect', () => {
    it('パックが1つの場合に3つに分裂する', () => {
      const effect = new SplitEffect();
      const game = createGameState();
      const result = effect.apply(game, 'player', Date.now());
      expect(result.pucks).toHaveLength(3);
    });

    it('パックが複数の場合は変更しない', () => {
      const effect = new SplitEffect();
      const game = createGameState();
      game.pucks.push({ ...game.pucks[0], x: 100 });
      const result = effect.apply(game, 'player', Date.now());
      expect(result.pucks).toHaveLength(game.pucks.length);
    });
  });

  describe('SpeedEffect', () => {
    it('速度エフェクトを適用する', () => {
      const effect = new SpeedEffect();
      const game = createGameState();
      const now = Date.now();
      const result = effect.apply(game, 'player', now);
      expect(result.effects.player.speed).not.toBeNull();
      expect(result.effects.player.speed!.duration).toBe(8000);
    });
  });

  describe('InvisibleEffect', () => {
    it('不可視エフェクトを適用する', () => {
      const effect = new InvisibleEffect();
      const game = createGameState();
      const result = effect.apply(game, 'cpu', Date.now());
      expect(result.effects.cpu.invisible).toBe(5);
    });
  });

  describe('ShieldEffect', () => {
    it('シールドを有効にする', () => {
      const effect = new ShieldEffect();
      const game = createGameState();
      const result = effect.apply(game, 'player', Date.now());
      expect(result.effects.player.shield).toBe(true);
    });
  });

  describe('MagnetEffect', () => {
    it('マグネットエフェクトを適用する', () => {
      const effect = new MagnetEffect();
      const game = createGameState();
      const now = Date.now();
      const result = effect.apply(game, 'player', now);
      expect(result.effects.player.magnet).not.toBeNull();
      expect(result.effects.player.magnet!.duration).toBe(5000);
    });
  });

  describe('BigEffect', () => {
    it('巨大化エフェクトを適用する', () => {
      const effect = new BigEffect();
      const game = createGameState();
      const now = Date.now();
      const result = effect.apply(game, 'cpu', now);
      expect(result.effects.cpu.big).not.toBeNull();
      expect(result.effects.cpu.big!.scale).toBe(1.5);
    });
  });

  describe('SplitEffect（境界値）', () => {
    it('パックの速度が0の場合、デフォルト速度3で分裂する', () => {
      const effect = new SplitEffect();
      const game = createGameState();
      game.pucks[0] = { ...game.pucks[0], vx: 0, vy: 0 };
      const result = effect.apply(game, 'player', Date.now());
      expect(result.pucks).toHaveLength(3);
      // 追加パック（インデックス1,2）はデフォルト速度3で分裂方向に飛ぶ
      const additionalPucks = result.pucks.slice(1);
      additionalPucks.forEach(p => {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        expect(speed).toBeCloseTo(3, 0);
      });
    });
  });

  describe('エフェクトの不変性', () => {
    it('SpeedEffect は元のゲーム状態を変更しない', () => {
      const effect = new SpeedEffect();
      const game = createGameState();
      const originalSpeed = game.effects.player.speed;
      effect.apply(game, 'player', Date.now());
      expect(game.effects.player.speed).toBe(originalSpeed);
    });

    it('ShieldEffect は他のエフェクトに影響しない', () => {
      const effect = new ShieldEffect();
      const game = createGameState();
      const result = effect.apply(game, 'player', Date.now());
      expect(result.effects.player.shield).toBe(true);
      // 他のエフェクトは変更されていない
      expect(result.effects.player.speed).toBeNull();
      expect(result.effects.player.invisible).toBe(0);
      expect(result.effects.player.magnet).toBeNull();
      expect(result.effects.player.big).toBeNull();
      // CPU 側は影響を受けない
      expect(result.effects.cpu.shield).toBe(false);
    });
  });

  describe('ItemEffectRegistry', () => {
    it('全エフェクトが登録されている', () => {
      const registry = new ItemEffectRegistry();
      expect(registry.getAll()).toHaveLength(6);
    });

    it('タイプ名でエフェクトを適用できる', () => {
      const registry = new ItemEffectRegistry();
      const game = createGameState();
      const result = registry.apply('shield', game, 'player', Date.now());
      expect(result.effects.player.shield).toBe(true);
    });

    it('未登録のタイプ名では状態を変更しない', () => {
      const registry = new ItemEffectRegistry();
      const game = createGameState();
      const result = registry.apply('unknown' as never, game, 'player', Date.now());
      expect(result).toEqual(game);
    });

    it('register で新しい Strategy を登録できる', () => {
      const registry = new ItemEffectRegistry();
      const customStrategy = {
        type: 'shield' as const,
        apply: (state: GameState) => ({ ...state, combo: { count: 99, lastScorer: undefined } }),
      };
      registry.register(customStrategy);
      const game = createGameState();
      const result = registry.apply('shield', game, 'player', Date.now());
      expect(result.combo.count).toBe(99);
    });
  });
});
