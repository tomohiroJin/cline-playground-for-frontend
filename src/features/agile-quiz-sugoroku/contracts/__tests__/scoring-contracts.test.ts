/**
 * スコア契約のテスト
 */
import {
  assertValidGradeClassification,
  assertValidDerivedStats,
  assertNonNegativeDebt,
  ContractViolationError,
} from '..';
import type { DerivedStats } from '../../domain/types';

// テスト用ヘルパー: 有効な DerivedStats を生成
const createDerivedStats = (overrides: Partial<DerivedStats> = {}): DerivedStats => ({
  correctRate: 75,
  averageSpeed: 5.0,
  stability: 80,
  sprintCorrectRates: [60, 80, 85],
  ...overrides,
});

describe('scoring-contracts', () => {
  describe('assertValidGradeClassification', () => {
    describe('正常系', () => {
      it('有効なグレード文字列でエラーを投げない', () => {
        // Act & Assert
        expect(() => assertValidGradeClassification('S')).not.toThrow();
        expect(() => assertValidGradeClassification('A')).not.toThrow();
        expect(() => assertValidGradeClassification('B')).not.toThrow();
        expect(() => assertValidGradeClassification('C')).not.toThrow();
        expect(() => assertValidGradeClassification('D')).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('無効なグレード文字列の場合にエラーを投げる', () => {
        // Act & Assert
        expect(() => assertValidGradeClassification('E')).toThrow(ContractViolationError);
        expect(() => assertValidGradeClassification('F')).toThrow(ContractViolationError);
        expect(() => assertValidGradeClassification('')).toThrow(ContractViolationError);
        expect(() => assertValidGradeClassification('s')).toThrow(ContractViolationError);
      });
    });
  });

  describe('assertValidDerivedStats', () => {
    describe('正常系', () => {
      it('有効な DerivedStats でエラーを投げない', () => {
        // Arrange
        const stats = createDerivedStats();

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).not.toThrow();
      });

      it('正答率 0% で有効', () => {
        // Arrange
        const stats = createDerivedStats({ correctRate: 0 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).not.toThrow();
      });

      it('正答率 100% で有効', () => {
        // Arrange
        const stats = createDerivedStats({ correctRate: 100 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).not.toThrow();
      });

      it('平均速度 0 で有効（即答）', () => {
        // Arrange
        const stats = createDerivedStats({ averageSpeed: 0 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).not.toThrow();
      });

      it('安定度 0 で有効', () => {
        // Arrange
        const stats = createDerivedStats({ stability: 0 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('正答率が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createDerivedStats({ correctRate: -1 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidDerivedStats(stats)).toThrow('正答率が範囲外');
      });

      it('正答率が 100 を超える場合にエラーを投げる', () => {
        // Arrange
        const stats = createDerivedStats({ correctRate: 101 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidDerivedStats(stats)).toThrow('正答率が範囲外');
      });

      it('平均速度が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createDerivedStats({ averageSpeed: -1 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidDerivedStats(stats)).toThrow('平均回答時間が負');
      });

      it('安定度が負の場合にエラーを投げる', () => {
        // Arrange
        const stats = createDerivedStats({ stability: -1 });

        // Act & Assert
        expect(() => assertValidDerivedStats(stats)).toThrow(ContractViolationError);
        expect(() => assertValidDerivedStats(stats)).toThrow('安定度が負');
      });
    });
  });

  describe('assertNonNegativeDebt', () => {
    describe('正常系', () => {
      it('負債が 0 以上でエラーを投げない', () => {
        // Act & Assert
        expect(() => assertNonNegativeDebt(0)).not.toThrow();
        expect(() => assertNonNegativeDebt(10)).not.toThrow();
        expect(() => assertNonNegativeDebt(100)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('負債が負の場合にエラーを投げる', () => {
        // Act & Assert
        expect(() => assertNonNegativeDebt(-1)).toThrow(ContractViolationError);
        expect(() => assertNonNegativeDebt(-0.5)).toThrow(ContractViolationError);
      });
    });
  });
});
