/**
 * ゲーム契約のテスト
 */
import {
  assertValidGameStats,
  assertValidSprintNumber,
  assertCanStartSprint,
  ContractViolationError,
} from '..';
import type { GameStats, GamePhase } from '../../domain/types';

// テスト用ヘルパー: 有効な GameStats を生成
const createValidGameStats = (overrides: Partial<GameStats> = {}): GameStats => ({
  totalCorrect: 3,
  totalQuestions: 5,
  speeds: [3.0, 4.5, 2.1, 5.0, 3.8],
  debt: 10,
  emergencyCount: 1,
  emergencySuccess: 1,
  combo: 2,
  maxCombo: 4,
  ...overrides,
});

describe('game-contracts', () => {
  describe('assertValidGameStats', () => {
    describe('正常系', () => {
      it('有効な GameStats でエラーを投げない', () => {
        // Arrange
        const stats = createValidGameStats();

        // Act & Assert
        expect(() => assertValidGameStats(stats)).not.toThrow();
      });

      it('すべてゼロの初期状態で有効', () => {
        // Arrange
        const stats = createValidGameStats({
          totalCorrect: 0,
          totalQuestions: 0,
          speeds: [],
          debt: 0,
          emergencyCount: 0,
          emergencySuccess: 0,
          combo: 0,
          maxCombo: 0,
        });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).not.toThrow();
      });

      it('全問正解の場合（totalCorrect === totalQuestions）で有効', () => {
        // Arrange
        const stats = createValidGameStats({
          totalCorrect: 10,
          totalQuestions: 10,
        });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).not.toThrow();
      });

      it('emergencySuccess が 0 で emergencyCount が 0 の場合に有効', () => {
        // Arrange
        const stats = createValidGameStats({
          emergencyCount: 0,
          emergencySuccess: 0,
        });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('totalCorrect が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({ totalCorrect: -1 });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('正答数が負');
      });

      it('totalQuestions が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({ totalQuestions: -1, totalCorrect: 0 });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('合計問題数が負');
      });

      it('totalQuestions が totalCorrect より小さい場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({
          totalCorrect: 6,
          totalQuestions: 5,
        });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('合計問題数が正答数を下回っている');
      });

      it('debt が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({ debt: -1 });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('負債が負');
      });

      it('combo が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({ combo: -1 });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('コンボが負');
      });

      it('maxCombo が combo より小さい場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({
          combo: 5,
          maxCombo: 3,
        });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('最大コンボが現在コンボを下回っている');
      });

      it('emergencyCount が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({ emergencyCount: -1 });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('緊急対応回数が負');
      });

      it('emergencySuccess が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({
          emergencyCount: 0,
          emergencySuccess: -1,
        });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('緊急対応成功数が負');
      });

      it('emergencySuccess が emergencyCount を超える場合にエラーを投げる', () => {
        // Arrange
        const stats = createValidGameStats({
          emergencyCount: 2,
          emergencySuccess: 3,
        });

        // Act & Assert
        expect(() => assertValidGameStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidGameStats(stats)).toThrow('緊急対応成功数が発生回数を超えている');
      });
    });
  });

  describe('assertValidSprintNumber', () => {
    describe('正常系', () => {
      it('有効なスプリント番号でエラーを投げない', () => {
        // Act & Assert
        expect(() => assertValidSprintNumber(1, 5)).not.toThrow();
        expect(() => assertValidSprintNumber(3, 5)).not.toThrow();
        expect(() => assertValidSprintNumber(5, 5)).not.toThrow();
      });

      it('スプリント数 1 の最小構成で有効', () => {
        // Act & Assert
        expect(() => assertValidSprintNumber(1, 1)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('スプリント番号が 0 以下の場合にエラーを投げる', () => {
        // Act & Assert
        expect(() => assertValidSprintNumber(0, 5)).toThrow(ContractViolationError);
        expect(() => assertValidSprintNumber(-1, 5)).toThrow(ContractViolationError);
      });

      it('スプリント番号が最大を超える場合にエラーを投げる', () => {
        // Act & Assert
        expect(() => assertValidSprintNumber(6, 5)).toThrow(ContractViolationError);
        expect(() => assertValidSprintNumber(9, 8)).toThrow(ContractViolationError);
      });

      it('maxSprints が 0 以下の場合にエラーを投げる', () => {
        // Act & Assert
        expect(() => assertValidSprintNumber(1, 0)).toThrow(ContractViolationError);
        expect(() => assertValidSprintNumber(1, -1)).toThrow(ContractViolationError);
      });
    });
  });

  describe('assertCanStartSprint', () => {
    describe('正常系', () => {
      it('sprint-start フェーズかつ有効なスプリント番号でエラーを投げない', () => {
        // Act & Assert
        expect(() => assertCanStartSprint('sprint-start', 1, 5)).not.toThrow();
        expect(() => assertCanStartSprint('sprint-start', 5, 5)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('フェーズが sprint-start でない場合にエラーを投げる', () => {
        // Arrange
        const invalidPhases: GamePhase[] = ['title', 'game', 'result', 'retro'];

        // Act & Assert
        for (const phase of invalidPhases) {
          expect(() => assertCanStartSprint(phase, 1, 5)).toThrow(ContractViolationError);
          expect(() => assertCanStartSprint(phase, 1, 5)).toThrow('sprint-start');
        }
      });

      it('スプリント番号が最大を超える場合にエラーを投げる', () => {
        // Act & Assert
        expect(() => assertCanStartSprint('sprint-start', 6, 5)).toThrow(ContractViolationError);
      });
    });
  });
});
