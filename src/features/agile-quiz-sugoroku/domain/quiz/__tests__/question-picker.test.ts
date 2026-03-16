/**
 * pickQuestion - 問題選択のテスト
 */
import { pickQuestion } from '../question-picker';
import { QUESTIONS } from '../../../quiz-data';

describe('pickQuestion - 問題の選択', () => {
  const planningQuestions = QUESTIONS.planning;

  it('問題配列から問題を選択する', () => {
    // Arrange
    const fixedRandom = () => 0;

    // Act
    const { question, index } = pickQuestion(planningQuestions, { randomFn: fixedRandom });

    // Assert
    expect(question).toBeDefined();
    expect(question.question).toBeDefined();
    expect(question.options).toHaveLength(4);
    expect(typeof question.answer).toBe('number');
    expect(index).toBe(0);
  });

  it('使用済みインデックスを避けて未使用の問題を選ぶ', () => {
    // Arrange
    const fixedRandom = () => 0;
    const used = new Set([0]);

    // Act
    const { index } = pickQuestion(planningQuestions, { usedIndices: used, randomFn: fixedRandom });

    // Assert
    expect(index).not.toBe(0);
  });

  it('全問題が使用済みの場合でもランダムに選択する', () => {
    // Arrange
    const fixedRandom = () => 0;
    const used = new Set(Array.from({ length: 100 }, (_, i) => i));

    // Act
    const { question } = pickQuestion(planningQuestions, { usedIndices: used, randomFn: fixedRandom });

    // Assert
    expect(question).toBeDefined();
  });

  it('後方互換: Set<number> を直接渡せる', () => {
    // Arrange
    const used = new Set([0]);

    // Act
    const { question } = pickQuestion(planningQuestions, used);

    // Assert
    expect(question).toBeDefined();
  });

  // ── ランダム依存: 乱数固定で特定の問題が選択される ──────

  describe('乱数固定による確定的選択', () => {
    it('randomFn=0.0 → 未使用リストの最初の問題が選択される', () => {
      // Arrange
      const fixedRandom = () => 0.0;

      // Act
      const { index } = pickQuestion(planningQuestions, { randomFn: fixedRandom });

      // Assert: floor(0.0 * available.length) = 0 → index 0
      expect(index).toBe(0);
    });

    it('randomFn=0.5 → 未使用リストの中間の問題が選択される', () => {
      // Arrange
      const fixedRandom = () => 0.5;

      // Act
      const { index } = pickQuestion(planningQuestions, { randomFn: fixedRandom });

      // Assert: floor(0.5 * length) → 中間のインデックス
      expect(index).toBe(Math.floor(0.5 * planningQuestions.length));
    });

    it('randomFn=0.99 → 未使用リストの末尾付近の問題が選択される', () => {
      // Arrange
      const fixedRandom = () => 0.99;

      // Act
      const { index } = pickQuestion(planningQuestions, { randomFn: fixedRandom });

      // Assert
      expect(index).toBe(Math.floor(0.99 * planningQuestions.length));
    });

    it('同じ randomFn で同じ結果が再現される', () => {
      // Arrange
      const fixedRandom = () => 0.3;

      // Act
      const result1 = pickQuestion(planningQuestions, { randomFn: fixedRandom });
      const result2 = pickQuestion(planningQuestions, { randomFn: fixedRandom });

      // Assert
      expect(result1.index).toBe(result2.index);
      expect(result1.question.question).toBe(result2.question.question);
    });
  });

  // ── 全問題使用済み時のリサイクル動作 ──────────────────

  describe('リサイクル動作', () => {
    it('全問題が使用済みの場合、全問題からランダムに選択する', () => {
      // Arrange: 全インデックスを使用済みに
      const allUsed = new Set(planningQuestions.map((_, i) => i));
      const fixedRandom = () => 0;

      // Act
      const { question, index } = pickQuestion(planningQuestions, {
        usedIndices: allUsed,
        randomFn: fixedRandom,
      });

      // Assert: 全問使用済みでも問題が返される（リサイクル）
      expect(question).toBeDefined();
      expect(index).toBe(0);
    });

    it('未使用が1問だけの場合、その問題が選択される', () => {
      // Arrange: インデックス2以外を全て使用済みに
      const used = new Set(planningQuestions.map((_, i) => i).filter(i => i !== 2));

      // Act
      const { index } = pickQuestion(planningQuestions, { usedIndices: used, randomFn: () => 0 });

      // Assert
      expect(index).toBe(2);
    });
  });
});
