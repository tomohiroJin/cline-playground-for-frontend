/**
 * Air Hockey - アイテムエフェクトのテスト
 */
import { ItemEffects, applyItemEffect } from './items';
import { GameState, GameEffects } from './types';
import { EntityFactory } from './entities';

/** テスト用のゲーム状態を生成 */
const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  ...EntityFactory.createGameState(),
  ...overrides,
});

describe('Air Hockey - アイテムエフェクト', () => {
  // ── ItemEffects.split ────────────────────────────────

  describe('ItemEffects.split - パック分裂', () => {
    it('パック1つの場合は3つに分裂する', () => {
      const game = createTestGameState();
      expect(game.pucks).toHaveLength(1);
      const result = ItemEffects.split(game);
      expect(result.pucks).toHaveLength(3);
    });

    it('分裂後のパックは元のパック位置付近に生成される', () => {
      const game = createTestGameState();
      const originalX = game.pucks[0].x;
      const result = ItemEffects.split(game);
      result.pucks!.forEach((puck) => {
        expect(Math.abs(puck.x - originalX)).toBeLessThanOrEqual(20);
      });
    });

    it('既に複数パックの場合は分裂しない', () => {
      const game = createTestGameState({
        pucks: [
          EntityFactory.createPuck(100, 300),
          EntityFactory.createPuck(200, 300),
        ],
      });
      const result = ItemEffects.split(game);
      expect(result.pucks).toBeUndefined();
    });
  });

  // ── ItemEffects.speed ────────────────────────────────

  describe('ItemEffects.speed - スピードアップ', () => {
    it('ターゲットのspeedエフェクトが設定される', () => {
      const game = createTestGameState();
      const result = ItemEffects.speed(game, 'player');
      expect(result.effects!.player.speed).not.toBeNull();
      expect(result.effects!.player.speed!.duration).toBe(8000);
    });

    it('cpu側にもスピードエフェクトが設定できる', () => {
      const game = createTestGameState();
      const result = ItemEffects.speed(game, 'cpu');
      expect(result.effects!.cpu.speed).not.toBeNull();
    });
  });

  // ── ItemEffects.invisible ────────────────────────────

  describe('ItemEffects.invisible - 透明化', () => {
    it('ターゲットのinvisibleカウントが設定される', () => {
      const game = createTestGameState();
      const result = ItemEffects.invisible(game, 'player');
      expect(result.effects!.player.invisible).toBe(5);
    });

    it('cpu側にも透明化が設定できる', () => {
      const game = createTestGameState();
      const result = ItemEffects.invisible(game, 'cpu');
      expect(result.effects!.cpu.invisible).toBe(5);
    });
  });

  // ── applyItemEffect ──────────────────────────────────

  describe('applyItemEffect - エフェクト統合適用', () => {
    it('splitアイテムの適用でパック分裂とflashが設定される', () => {
      const game = createTestGameState();
      const now = Date.now();
      const result = applyItemEffect(game, { id: 'split' }, 'player', now);
      expect(result.pucks).toHaveLength(3);
      expect(result.flash).toEqual({ type: 'split', time: now });
    });

    it('speedアイテムの適用でエフェクトとflashが設定される', () => {
      const game = createTestGameState();
      const now = Date.now();
      const result = applyItemEffect(game, { id: 'speed' }, 'player', now);
      expect(result.effects!.player.speed).not.toBeNull();
      expect(result.flash).toEqual({ type: 'speed', time: now });
    });

    it('invisibleアイテムの適用でエフェクトとflashが設定される', () => {
      const game = createTestGameState();
      const now = Date.now();
      const result = applyItemEffect(game, { id: 'invisible' }, 'cpu', now);
      expect(result.effects!.cpu.invisible).toBe(5);
      expect(result.flash).toEqual({ type: 'invisible', time: now });
    });
  });
});
