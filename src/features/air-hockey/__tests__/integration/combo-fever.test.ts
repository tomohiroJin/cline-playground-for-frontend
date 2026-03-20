/**
 * コンボ・フィーバー統合テスト
 * - 連続得点でコンボカウントが増加する
 * - コンボ閾値到達でフィーバーが発動する
 * - フィーバー中のエフェクトが正しく適用される
 */
import { GameRunner } from '../helpers/game-runner';
import { TestFactory } from '../helpers/factories';
import { PHYSICS_CONSTANTS } from '../../domain/constants/physics';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PUCK_RADIUS } = PHYSICS_CONSTANTS;

describe('コンボ・フィーバー統合テスト', () => {
  const defaultField = TestFactory.createTestFieldConfig();
  const easyAi = TestFactory.createTestAiConfig();

  describe('コンボ', () => {
    it('連続ゴールでコンボカウントが増加する', () => {
      // Arrange
      const runner = new GameRunner(defaultField, easyAi, { winScore: 10 });

      // Act: プレイヤーが2回連続ゴール
      // 1回目のゴール
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
      runner.setPuckVelocity(0, 0, -15);
      runner.runUntil(() => runner.getScore().player > 0, 100);

      // 2回目のゴール
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
      runner.setPuckVelocity(0, 0, -15);
      runner.runUntil(() => runner.getScore().player > 1, 100);

      // Assert
      const state = runner.getState();
      expect(state.combo.count).toBe(2);
      expect(state.combo.lastScorer).toBe('player');
    });

    it('異なるプレイヤーがゴールするとコンボがリセットされる', () => {
      // Arrange
      const runner = new GameRunner(defaultField, easyAi, { winScore: 10 });

      // Act: プレイヤーが1回ゴール
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
      runner.setPuckVelocity(0, 0, -15);
      runner.runUntil(() => runner.getScore().player > 0, 100);

      // CPU が1回ゴール
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, CANVAS_HEIGHT - PUCK_RADIUS - 5);
      runner.setPuckVelocity(0, 0, 15);
      runner.runUntil(() => runner.getScore().cpu > 0, 100);

      // Assert: コンボはリセットされて1になる
      const state = runner.getState();
      expect(state.combo.count).toBe(1);
      expect(state.combo.lastScorer).toBe('cpu');
    });
  });

  describe('フィーバー', () => {
    it('コンボ3以上でフィーバーが発動する', () => {
      // Arrange
      const runner = new GameRunner(defaultField, easyAi, { winScore: 10 });

      // Act: プレイヤーが3回連続ゴール
      for (let i = 0; i < 3; i++) {
        runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
        runner.setPuckVelocity(0, 0, -15);
        runner.runUntil(() => runner.getScore().player > i, 100);
      }

      // Assert: フィーバーが発動している
      const state = runner.getState();
      expect(state.fever.active).toBe(true);
    });

    it('フィーバー発動時に FEVER_ACTIVATED イベントが発行される', () => {
      // Arrange
      const runner = new GameRunner(defaultField, easyAi, { winScore: 10 });

      // Act: プレイヤーが3回連続ゴール
      for (let i = 0; i < 3; i++) {
        runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
        runner.setPuckVelocity(0, 0, -15);
        runner.runUntil(() => runner.getScore().player > i, 100);
      }

      // Assert
      const feverEvents = runner.getEventsOfType('FEVER_ACTIVATED');
      expect(feverEvents.length).toBe(1);
    });

    it('異なるプレイヤーがゴールするとフィーバーは発動しない', () => {
      // Arrange
      const runner = new GameRunner(defaultField, easyAi, { winScore: 10 });

      // Act: プレイヤー2回 → CPU1回
      for (let i = 0; i < 2; i++) {
        runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
        runner.setPuckVelocity(0, 0, -15);
        runner.runUntil(() => runner.getScore().player > i, 100);
      }
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, CANVAS_HEIGHT - PUCK_RADIUS - 5);
      runner.setPuckVelocity(0, 0, 15);
      runner.runUntil(() => runner.getScore().cpu > 0, 100);

      // Assert: フィーバーは発動していない
      const state = runner.getState();
      expect(state.fever.active).toBe(false);
    });
  });

  describe('COMBO_INCREASED イベント', () => {
    it('コンボ2以上でイベントが発行される', () => {
      // Arrange
      const runner = new GameRunner(defaultField, easyAi, { winScore: 10 });

      // Act: プレイヤーが2回連続ゴール
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
      runner.setPuckVelocity(0, 0, -15);
      runner.runUntil(() => runner.getScore().player > 0, 100);

      runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
      runner.setPuckVelocity(0, 0, -15);
      runner.runUntil(() => runner.getScore().player > 1, 100);

      // Assert
      const comboEvents = runner.getEventsOfType('COMBO_INCREASED');
      expect(comboEvents.length).toBeGreaterThanOrEqual(1);
      expect(comboEvents[comboEvents.length - 1].count).toBe(2);
    });
  });
});
