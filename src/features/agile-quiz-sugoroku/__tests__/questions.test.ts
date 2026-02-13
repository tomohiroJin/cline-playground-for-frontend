/**
 * Agile Quiz Sugoroku - 問題データの構造検証テスト
 */
import { QUESTIONS } from '../quiz-data';

describe('Agile Quiz Sugoroku - 問題データの構造検証', () => {
  const expectedCategories = [
    'planning',
    'impl1',
    'test1',
    'refinement',
    'impl2',
    'test2',
    'review',
    'emergency',
  ];

  it('全カテゴリの問題データが存在する', () => {
    expectedCategories.forEach((category) => {
      expect(QUESTIONS[category]).toBeDefined();
      expect(QUESTIONS[category].length).toBeGreaterThan(0);
    });
  });

  it.each(expectedCategories)(
    '%s: 全問題にq(問題文), o(4択), a(0-3)が含まれる',
    (category) => {
      QUESTIONS[category].forEach((question, index) => {
        expect(question.q).toBeDefined();
        expect(typeof question.q).toBe('string');
        expect(question.q.length).toBeGreaterThan(0);

        expect(question.o).toBeDefined();
        expect(question.o).toHaveLength(4);
        question.o.forEach((option) => {
          expect(typeof option).toBe('string');
        });

        expect(question.a).toBeDefined();
        expect(question.a).toBeGreaterThanOrEqual(0);
        expect(question.a).toBeLessThanOrEqual(3);
      });
    }
  );

  it('各カテゴリに十分な数の問題がある（5問以上）', () => {
    expectedCategories.forEach((category) => {
      expect(QUESTIONS[category].length).toBeGreaterThanOrEqual(5);
    });
  });

  it('選択肢の正解インデックスが選択肢配列の範囲内にある', () => {
    expectedCategories.forEach((category) => {
      QUESTIONS[category].forEach((question) => {
        expect(question.a).toBeLessThan(question.o.length);
      });
    });
  });
});
