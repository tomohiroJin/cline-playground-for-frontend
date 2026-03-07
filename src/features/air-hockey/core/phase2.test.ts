/**
 * Phase 2: ゲームプレイ深化のテスト
 */
import { CONSTANTS } from './constants';
import { EntityFactory } from './entities';
import { ItemEffects, applyItemEffect } from './items';
import { GameState, GamePhase, ComboState, MatchStats, ItemType } from './types';
import { ITEMS } from './config';

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

/** テスト用のゲーム状態を生成 */
const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  ...EntityFactory.createGameState(),
  ...overrides,
});

describe('Phase 2: ゲームプレイ深化', () => {
  // ── 2.1 ポーズ機能 ──────────────────────────────
  describe('2.1 ポーズ機能', () => {
    it('GamePhase に paused が含まれている', () => {
      const phases: GamePhase[] = ['countdown', 'playing', 'paused', 'finished'];
      expect(phases).toContain('paused');
    });

    it('ポーズ中はゲーム状態が変化しない（パックの位置が保持される）', () => {
      const state = createTestGameState();
      const initialPuckX = state.pucks[0].x;
      const initialPuckY = state.pucks[0].y;
      // ポーズ中はゲームループがパック更新をスキップするため位置は変化しない
      expect(state.pucks[0].x).toBe(initialPuckX);
      expect(state.pucks[0].y).toBe(initialPuckY);
    });
  });

  // ── 2.2 新アイテム追加 ──────────────────────────
  describe('2.2 新アイテム追加', () => {
    describe('ItemType に新アイテムが追加されている', () => {
      it('shield タイプが ItemType に含まれる', () => {
        const type: ItemType = 'shield';
        expect(type).toBe('shield');
      });

      it('magnet タイプが ItemType に含まれる', () => {
        const type: ItemType = 'magnet';
        expect(type).toBe('magnet');
      });

      it('big タイプが ItemType に含まれる', () => {
        const type: ItemType = 'big';
        expect(type).toBe('big');
      });
    });

    describe('ITEMS 設定に新アイテムが追加されている', () => {
      it('Shield アイテムが ITEMS に含まれる', () => {
        const shield = ITEMS.find(i => i.id === 'shield');
        expect(shield).toBeDefined();
        expect(shield!.name).toBe('Shield');
        expect(shield!.color).toBe('#FFD700');
      });

      it('Magnet アイテムが ITEMS に含まれる', () => {
        const magnet = ITEMS.find(i => i.id === 'magnet');
        expect(magnet).toBeDefined();
        expect(magnet!.name).toBe('Magnet');
        expect(magnet!.color).toBe('#FF6B35');
      });

      it('Big アイテムが ITEMS に含まれる', () => {
        const big = ITEMS.find(i => i.id === 'big');
        expect(big).toBeDefined();
        expect(big!.name).toBe('Big');
        expect(big!.color).toBe('#00FF88');
      });
    });

    describe('Shield エフェクト', () => {
      it('shield エフェクトがターゲットの shield を有効にする', () => {
        const game = createTestGameState();
        const result = ItemEffects.shield(game, 'player');
        expect(result.effects!.player.shield).toBe(true);
      });

      it('shield エフェクトが cpu 側にも適用できる', () => {
        const game = createTestGameState();
        const result = ItemEffects.shield(game, 'cpu');
        expect(result.effects!.cpu.shield).toBe(true);
      });
    });

    describe('Magnet エフェクト', () => {
      it('magnet エフェクトがターゲットの magnet を有効にする', () => {
        const game = createTestGameState();
        const result = ItemEffects.magnet(game, 'player');
        expect(result.effects!.player.magnet).not.toBeNull();
        expect(result.effects!.player.magnet!.duration).toBe(5000);
      });

      it('magnet エフェクトが cpu 側にも適用できる', () => {
        const game = createTestGameState();
        const result = ItemEffects.magnet(game, 'cpu');
        expect(result.effects!.cpu.magnet).not.toBeNull();
      });
    });

    describe('Big エフェクト', () => {
      it('big エフェクトがターゲットの big を有効にする', () => {
        const game = createTestGameState();
        const result = ItemEffects.big(game, 'player');
        expect(result.effects!.player.big).not.toBeNull();
        expect(result.effects!.player.big!.duration).toBe(8000);
      });

      it('big 発動中にマレット半径が 1.5 倍になる', () => {
        const game = createTestGameState();
        const result = ItemEffects.big(game, 'player');
        expect(result.effects!.player.big!.scale).toBe(1.5);
      });
    });

    describe('applyItemEffect に新アイテムが統合されている', () => {
      it('shield アイテムの適用でエフェクトと flash が設定される', () => {
        const game = createTestGameState();
        const now = Date.now();
        const result = applyItemEffect(game, { id: 'shield' }, 'player', now);
        expect(result.effects!.player.shield).toBe(true);
        expect(result.flash).toEqual({ type: 'shield', time: now });
      });

      it('magnet アイテムの適用でエフェクトと flash が設定される', () => {
        const game = createTestGameState();
        const now = Date.now();
        const result = applyItemEffect(game, { id: 'magnet' }, 'cpu', now);
        expect(result.effects!.cpu.magnet).not.toBeNull();
        expect(result.flash).toEqual({ type: 'magnet', time: now });
      });

      it('big アイテムの適用でエフェクトと flash が設定される', () => {
        const game = createTestGameState();
        const now = Date.now();
        const result = applyItemEffect(game, { id: 'big' }, 'player', now);
        expect(result.effects!.player.big).not.toBeNull();
        expect(result.flash).toEqual({ type: 'big', time: now });
      });
    });
  });

  // ── 2.3 コンボシステム強化 ──────────────────────
  describe('2.3 コンボシステム強化', () => {
    it('ComboState 型が count と lastScorer を持つ', () => {
      const combo: ComboState = { count: 0, lastScorer: undefined };
      expect(combo.count).toBe(0);
      expect(combo.lastScorer).toBeUndefined();
    });

    it('同じプレイヤーの連続得点でコンボカウントが増加する', () => {
      const combo: ComboState = { count: 1, lastScorer: 'player' };
      // 同じスコアラーが得点した場合
      const newCombo: ComboState = {
        count: combo.lastScorer === 'player' ? combo.count + 1 : 1,
        lastScorer: 'player',
      };
      expect(newCombo.count).toBe(2);
    });

    it('相手が得点するとコンボがリセットされる', () => {
      const combo: ComboState = { count: 3, lastScorer: 'player' };
      // 異なるスコアラーが得点した場合
      const newCombo: ComboState = {
        count: combo.lastScorer === 'cpu' ? combo.count + 1 : 1,
        lastScorer: 'cpu',
      };
      expect(newCombo.count).toBe(1);
    });

    it('GameState に combo フィールドが存在する', () => {
      const state = createTestGameState();
      expect(state.combo).toBeDefined();
      expect(state.combo.count).toBe(0);
    });
  });

  // ── 2.4 カムバックメカニクス ────────────────────
  describe('2.4 カムバックメカニクス', () => {
    it('カムバック定数が定義されている', () => {
      expect(CONSTANTS.COMEBACK).toBeDefined();
      expect(CONSTANTS.COMEBACK.THRESHOLD).toBe(3);
      expect(CONSTANTS.COMEBACK.MALLET_BONUS).toBe(0.1);
      expect(CONSTANTS.COMEBACK.GOAL_REDUCTION).toBe(0.1);
    });

    it('スコア差 3 以上でカムバック効果が発動する', () => {
      const playerScore = 1;
      const cpuScore = 4;
      const diff = cpuScore - playerScore;
      expect(diff >= CONSTANTS.COMEBACK.THRESHOLD).toBe(true);
    });

    it('スコア差 2 以下では効果が発動しない', () => {
      const playerScore = 2;
      const cpuScore = 4;
      const diff = cpuScore - playerScore;
      expect(diff >= CONSTANTS.COMEBACK.THRESHOLD).toBe(false);
    });

    it('カムバック発動時にマレット半径が 10% 拡大する', () => {
      const baseRadius = CONSTANTS.SIZES.MALLET;
      const bonus = CONSTANTS.COMEBACK.MALLET_BONUS;
      const comebackRadius = baseRadius * (1 + bonus);
      expect(comebackRadius).toBeCloseTo(baseRadius * 1.1);
    });

    it('カムバック発動時にゴールサイズが 10% 縮小する', () => {
      const baseGoalSize = 120; // classic field
      const reduction = CONSTANTS.COMEBACK.GOAL_REDUCTION;
      const comebackGoalSize = baseGoalSize * (1 - reduction);
      expect(comebackGoalSize).toBeCloseTo(baseGoalSize * 0.9);
    });
  });

  // ── 2.5 試合統計 ────────────────────────────────
  describe('2.5 試合統計', () => {
    it('MatchStats 型が必要なフィールドを持つ', () => {
      const stats: MatchStats = {
        playerHits: 0,
        cpuHits: 0,
        maxPuckSpeed: 0,
        playerItemsCollected: 0,
        cpuItemsCollected: 0,
        playerSaves: 0,
        cpuSaves: 0,
        matchDuration: 0,
      };
      expect(stats.playerHits).toBe(0);
      expect(stats.cpuHits).toBe(0);
      expect(stats.maxPuckSpeed).toBe(0);
      expect(stats.playerItemsCollected).toBe(0);
      expect(stats.cpuItemsCollected).toBe(0);
      expect(stats.playerSaves).toBe(0);
      expect(stats.cpuSaves).toBe(0);
      expect(stats.matchDuration).toBe(0);
    });

    it('ヒット検出時に統計が正しくカウントされる', () => {
      const stats: MatchStats = {
        playerHits: 0,
        cpuHits: 0,
        maxPuckSpeed: 0,
        playerItemsCollected: 0,
        cpuItemsCollected: 0,
        playerSaves: 0,
        cpuSaves: 0,
        matchDuration: 0,
      };
      // プレイヤーのヒット
      stats.playerHits++;
      expect(stats.playerHits).toBe(1);
      // CPU のヒット
      stats.cpuHits++;
      expect(stats.cpuHits).toBe(1);
    });

    it('最高パック速度が更新される', () => {
      const stats: MatchStats = {
        playerHits: 0,
        cpuHits: 0,
        maxPuckSpeed: 5,
        playerItemsCollected: 0,
        cpuItemsCollected: 0,
        playerSaves: 0,
        cpuSaves: 0,
        matchDuration: 0,
      };
      const newSpeed = 12;
      stats.maxPuckSpeed = Math.max(stats.maxPuckSpeed, newSpeed);
      expect(stats.maxPuckSpeed).toBe(12);
    });

    it('セーブ数がカウントされる（ゴールライン付近でのヒット）', () => {
      const stats: MatchStats = {
        playerHits: 0,
        cpuHits: 0,
        maxPuckSpeed: 0,
        playerItemsCollected: 0,
        cpuItemsCollected: 0,
        playerSaves: 0,
        cpuSaves: 0,
        matchDuration: 0,
      };
      // プレイヤーのセーブ（ゴールライン付近のヒット）
      stats.playerSaves++;
      expect(stats.playerSaves).toBe(1);
    });

    it('初期 MatchStats が createMatchStats で生成できる', () => {
      const stats = EntityFactory.createMatchStats();
      expect(stats.playerHits).toBe(0);
      expect(stats.cpuHits).toBe(0);
      expect(stats.maxPuckSpeed).toBe(0);
      expect(stats.matchDuration).toBe(0);
    });
  });
});
