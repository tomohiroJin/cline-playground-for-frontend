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
  });
});
