/**
 * Agile Quiz Sugoroku - 問題データの構造検証テスト
 */
import { QUESTIONS } from '../quiz-data';
import { VALID_TAG_IDS } from '../questions/tag-master';

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
    '%s: 全問題にquestion(問題文), options(4択), answer(0-3)が含まれる',
    (category) => {
      QUESTIONS[category].forEach((question, index) => {
        expect(question.question).toBeDefined();
        expect(typeof question.question).toBe('string');
        expect(question.question.length).toBeGreaterThan(0);

        expect(question.options).toBeDefined();
        expect(question.options).toHaveLength(4);
        question.options.forEach((option) => {
          expect(typeof option).toBe('string');
        });

        expect(question.answer).toBeDefined();
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThanOrEqual(3);
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
        expect(question.answer).toBeLessThan(question.options.length);
      });
    });
  });

  describe('タグ検証', () => {
    it('全問題にtagsフィールドが存在する', () => {
      expectedCategories.forEach((category) => {
        QUESTIONS[category].forEach((question, index) => {
          expect(question.tags).toBeDefined();
          expect(Array.isArray(question.tags)).toBe(true);
          expect(question.tags!.length).toBeGreaterThanOrEqual(1);
        });
      });
    });

    it('全タグがマスタ定義に存在する', () => {
      expectedCategories.forEach((category) => {
        QUESTIONS[category].forEach((question, index) => {
          question.tags?.forEach((tag) => {
            expect(VALID_TAG_IDS).toContain(tag);
          });
        });
      });
    });

    it('タグマスタに重複IDがない', () => {
      const unique = new Set(VALID_TAG_IDS);
      expect(unique.size).toBe(VALID_TAG_IDS.length);
    });

    it('全問題にexplanation（解説）が存在する', () => {
      expectedCategories.forEach((category) => {
        QUESTIONS[category].forEach((question, index) => {
          expect(question.explanation).toBeDefined();
          expect(typeof question.explanation).toBe('string');
          expect(question.explanation!.length).toBeGreaterThan(0);
        });
      });
    });

    it('全タグが最低1問で使用されている', () => {
      const usedTags = new Set<string>();
      expectedCategories.forEach((category) => {
        QUESTIONS[category].forEach((question) => {
          question.tags?.forEach((tag) => usedTags.add(tag));
        });
      });
      VALID_TAG_IDS.forEach((tagId) => {
        expect(usedTags.has(tagId)).toBe(true);
      });
    });
  });
});
