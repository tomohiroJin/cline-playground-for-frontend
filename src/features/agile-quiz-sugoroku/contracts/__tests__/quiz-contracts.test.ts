/**
 * クイズ契約のテスト
 */
import {
  assertCanPickQuestion,
  assertValidAnswerResult,
  assertValidCombo,
  ContractViolationError,
} from '..';
import type { Question, AnswerResult } from '../../domain/types';

// テスト用ヘルパー: 有効な Question を生成
const createQuestion = (overrides: Partial<Question> = {}): Question => ({
  question: 'テスト問題',
  options: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
  answer: 0,
  tags: ['scrum'],
  explanation: '解説テキスト',
  ...overrides,
});

// テスト用ヘルパー: 有効な AnswerResult を生成
const createAnswerResult = (overrides: Partial<AnswerResult> = {}): AnswerResult => ({
  correct: true,
  speed: 5.0,
  eventId: 'impl1',
  ...overrides,
});

describe('quiz-contracts', () => {
  describe('assertCanPickQuestion', () => {
    describe('正常系', () => {
      it('問題プールが空でなく、usedIndices が範囲内でエラーを投げない', () => {
        // Arrange
        const questions = [createQuestion(), createQuestion(), createQuestion()];
        const usedIndices = new Set([0, 1]);

        // Act & Assert
        expect(() => assertCanPickQuestion(questions, usedIndices)).not.toThrow();
      });

      it('usedIndices が空の場合にエラーを投げない', () => {
        // Arrange
        const questions = [createQuestion()];
        const usedIndices = new Set<number>();

        // Act & Assert
        expect(() => assertCanPickQuestion(questions, usedIndices)).not.toThrow();
      });

      it('全問使用済みでもエラーを投げない（リサイクル可能）', () => {
        // Arrange
        const questions = [createQuestion(), createQuestion()];
        const usedIndices = new Set([0, 1]);

        // Act & Assert
        expect(() => assertCanPickQuestion(questions, usedIndices)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('問題プールが空の場合にエラーを投げる', () => {
        // Arrange
        const questions: Question[] = [];
        const usedIndices = new Set<number>();

        // Act & Assert
        expect(() => assertCanPickQuestion(questions, usedIndices)).toThrow(ContractViolationError);
        expect(() => assertCanPickQuestion(questions, usedIndices)).toThrow('問題プールが空');
      });

      it('usedIndices に負のインデックスがある場合にエラーを投げる', () => {
        // Arrange
        const questions = [createQuestion(), createQuestion()];
        const usedIndices = new Set([-1, 0]);

        // Act & Assert
        expect(() => assertCanPickQuestion(questions, usedIndices)).toThrow(ContractViolationError);
        expect(() => assertCanPickQuestion(questions, usedIndices)).toThrow('範囲外');
      });

      it('usedIndices に問題数以上のインデックスがある場合にエラーを投げる', () => {
        // Arrange
        const questions = [createQuestion(), createQuestion()];
        const usedIndices = new Set([0, 2]);

        // Act & Assert
        expect(() => assertCanPickQuestion(questions, usedIndices)).toThrow(ContractViolationError);
        expect(() => assertCanPickQuestion(questions, usedIndices)).toThrow('範囲外');
      });
    });
  });

  describe('assertValidAnswerResult', () => {
    describe('正常系', () => {
      it('有効な AnswerResult でエラーを投げない', () => {
        // Arrange
        const result = createAnswerResult();

        // Act & Assert
        expect(() => assertValidAnswerResult(result)).not.toThrow();
      });

      it('不正解の場合でも有効', () => {
        // Arrange
        const result = createAnswerResult({ correct: false });

        // Act & Assert
        expect(() => assertValidAnswerResult(result)).not.toThrow();
      });

      it('speed が 0 でも有効（即答）', () => {
        // Arrange
        const result = createAnswerResult({ speed: 0 });

        // Act & Assert
        expect(() => assertValidAnswerResult(result)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('speed が負の場合にエラーを投げる', () => {
        // Arrange
        const result = createAnswerResult({ speed: -1 });

        // Act & Assert
        expect(() => assertValidAnswerResult(result)).toThrow(ContractViolationError);
        expect(() => assertValidAnswerResult(result)).toThrow('回答時間が負');
      });

      it('eventId が空文字列の場合にエラーを投げる', () => {
        // Arrange
        const result = createAnswerResult({ eventId: '' });

        // Act & Assert
        expect(() => assertValidAnswerResult(result)).toThrow(ContractViolationError);
        expect(() => assertValidAnswerResult(result)).toThrow('イベントIDが空');
      });
    });
  });

  describe('assertValidCombo', () => {
    describe('正常系', () => {
      it('コンボが 0 以上でエラーを投げない', () => {
        // Act & Assert
        expect(() => assertValidCombo(0)).not.toThrow();
        expect(() => assertValidCombo(1)).not.toThrow();
        expect(() => assertValidCombo(10)).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('コンボが負の場合にエラーを投げる', () => {
        // Act & Assert
        expect(() => assertValidCombo(-1)).toThrow(ContractViolationError);
        expect(() => assertValidCombo(-5)).toThrow(ContractViolationError);
      });
    });
  });
});
