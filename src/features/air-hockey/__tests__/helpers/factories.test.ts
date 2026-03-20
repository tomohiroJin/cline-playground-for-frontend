/**
 * テストデータファクトリーのテスト
 * - 各ファクトリーメソッドがデフォルト値で正しいオブジェクトを生成する
 * - overrides でプロパティを上書きできる
 */
import { TestFactory } from './factories';
import { PHYSICS_CONSTANTS } from '../../domain/constants/physics';

describe('TestFactory', () => {
  describe('createTestPuck', () => {
    it('デフォルト値でパックを生成する', () => {
      const puck = TestFactory.createTestPuck();

      expect(puck.x).toBe(225);
      expect(puck.y).toBe(450);
      expect(puck.vx).toBe(0);
      expect(puck.vy).toBe(0);
      expect(puck.radius).toBe(PHYSICS_CONSTANTS.PUCK_RADIUS);
      expect(puck.visible).toBe(true);
      expect(puck.hitCount).toBe(0);
    });

    it('overrides でプロパティを上書きできる', () => {
      const puck = TestFactory.createTestPuck({ x: 100, vy: 5 });

      expect(puck.x).toBe(100);
      expect(puck.vy).toBe(5);
      expect(puck.y).toBe(450); // デフォルト値は維持
    });
  });

  describe('createTestMallet', () => {
    it('デフォルト値でプレイヤーマレットを生成する', () => {
      const mallet = TestFactory.createTestMallet();

      expect(mallet.x).toBe(225);
      expect(mallet.y).toBe(830);
      expect(mallet.vx).toBe(0);
      expect(mallet.vy).toBe(0);
      expect(mallet.radius).toBe(PHYSICS_CONSTANTS.MALLET_RADIUS);
      expect(mallet.side).toBe('player');
    });

    it('CPU マレットを生成できる', () => {
      const mallet = TestFactory.createTestMallet({ side: 'cpu', y: 70 });

      expect(mallet.side).toBe('cpu');
      expect(mallet.y).toBe(70);
    });
  });

  describe('createTestItem', () => {
    it('デフォルト値でアイテムを生成する', () => {
      const item = TestFactory.createTestItem();

      expect(item.id).toBe('split');
      expect(item.x).toBe(225);
      expect(item.y).toBe(450);
      expect(item.vx).toBe(0);
      expect(item.vy).toBe(0);
      expect(item.r).toBe(PHYSICS_CONSTANTS.ITEM_RADIUS);
      expect(item.name).toBeDefined();
      expect(item.color).toBeDefined();
      expect(item.icon).toBeDefined();
    });

    it('アイテムタイプを指定できる', () => {
      const item = TestFactory.createTestItem({ id: 'speed' });
      expect(item.id).toBe('speed');
    });

    it('アイテムタイプ指定時に対応するテンプレートの name/color/icon が設定される', () => {
      const speedItem = TestFactory.createTestItem({ id: 'speed' });
      expect(speedItem.name).toBe('Speed');
      expect(speedItem.color).toBe('#4ECDC4');
      expect(speedItem.icon).toBe('⚡');

      const shieldItem = TestFactory.createTestItem({ id: 'shield' });
      expect(shieldItem.name).toBe('Shield');
      expect(shieldItem.color).toBe('#FFD700');
    });
  });

  describe('createTestFieldConfig', () => {
    it('デフォルト値でフィールド設定を生成する', () => {
      const field = TestFactory.createTestFieldConfig();

      expect(field.id).toBe('classic');
      expect(field.name).toBeDefined();
      expect(field.goalSize).toBeGreaterThan(0);
      expect(field.color).toBeDefined();
      expect(field.obstacles).toBeDefined();
    });

    it('overrides でプロパティを上書きできる', () => {
      const field = TestFactory.createTestFieldConfig({ id: 'test-field', goalSize: 200 });

      expect(field.id).toBe('test-field');
      expect(field.goalSize).toBe(200);
    });
  });

  describe('createTestAiConfig', () => {
    it('デフォルト値で AI 設定を生成する', () => {
      const config = TestFactory.createTestAiConfig();

      expect(config.maxSpeed).toBeDefined();
      expect(config.predictionFactor).toBeDefined();
      expect(config.wobble).toBeDefined();
      expect(config.skipRate).toBeDefined();
      expect(config.centerWeight).toBeDefined();
      expect(typeof config.wallBounce).toBe('boolean');
    });

    it('overrides でプロパティを上書きできる', () => {
      const config = TestFactory.createTestAiConfig({ maxSpeed: 10, wallBounce: true });

      expect(config.maxSpeed).toBe(10);
      expect(config.wallBounce).toBe(true);
    });
  });

  describe('createTestStoryProgress', () => {
    it('デフォルト値でストーリー進行を生成する', () => {
      const progress = TestFactory.createTestStoryProgress();

      expect(progress.clearedStages).toEqual([]);
    });

    it('overrides でクリア済みステージを指定できる', () => {
      const progress = TestFactory.createTestStoryProgress({
        clearedStages: ['1-1', '1-2'],
      });

      expect(progress.clearedStages).toEqual(['1-1', '1-2']);
    });
  });

  describe('createTestMatchStats', () => {
    it('デフォルト値で試合統計を生成する', () => {
      const stats = TestFactory.createTestMatchStats();

      expect(stats.playerHits).toBe(0);
      expect(stats.cpuHits).toBe(0);
      expect(stats.maxPuckSpeed).toBe(0);
      expect(stats.playerItemsCollected).toBe(0);
      expect(stats.cpuItemsCollected).toBe(0);
      expect(stats.playerSaves).toBe(0);
      expect(stats.cpuSaves).toBe(0);
      expect(stats.matchDuration).toBe(0);
    });

    it('overrides でプロパティを上書きできる', () => {
      const stats = TestFactory.createTestMatchStats({ playerHits: 10, maxPuckSpeed: 15 });

      expect(stats.playerHits).toBe(10);
      expect(stats.maxPuckSpeed).toBe(15);
    });
  });

  describe('createTestGameState', () => {
    it('デフォルト値でゲーム状態を生成する', () => {
      const state = TestFactory.createTestGameState();

      expect(state.player).toBeDefined();
      expect(state.cpu).toBeDefined();
      expect(state.pucks).toHaveLength(1);
      expect(state.items).toEqual([]);
      expect(state.effects).toBeDefined();
      expect(state.combo).toBeDefined();
    });

    it('overrides でプロパティを上書きできる', () => {
      const state = TestFactory.createTestGameState({
        pucks: [{ x: 100, y: 200, vx: 0, vy: 1.5, visible: true, invisibleCount: 0 }],
      });

      expect(state.pucks[0].x).toBe(100);
      expect(state.pucks[0].y).toBe(200);
    });
  });
});
