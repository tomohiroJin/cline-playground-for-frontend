/**
 * デイリークイズのテスト
 */
import {
  getDailyQuestions,
  seededRandom,
  dateSeed,
  getDailyResult,
  saveDailyResult,
  getDailyStreak,
  DailyResult,
} from '../daily-quiz';

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('daily-quiz', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('dateSeed', () => {
    it('同じ日付から同じシード値を生成する', () => {
      const d1 = new Date('2026-03-07');
      const d2 = new Date('2026-03-07');
      expect(dateSeed(d1)).toBe(dateSeed(d2));
    });

    it('異なる日付から異なるシード値を生成する', () => {
      const d1 = new Date('2026-03-07');
      const d2 = new Date('2026-03-08');
      expect(dateSeed(d1)).not.toBe(dateSeed(d2));
    });
  });

  describe('seededRandom', () => {
    it('同じシードから同じ乱数列を返す', () => {
      const rng1 = seededRandom(12345);
      const rng2 = seededRandom(12345);
      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];
      expect(seq1).toEqual(seq2);
    });

    it('0以上1未満の値を返す', () => {
      const rng = seededRandom(42);
      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('getDailyQuestions', () => {
    it('5問を返す', () => {
      const questions = getDailyQuestions(new Date('2026-03-07'));
      expect(questions).toHaveLength(5);
    });

    it('同じ日付では同じ問題を返す', () => {
      const q1 = getDailyQuestions(new Date('2026-03-07'));
      const q2 = getDailyQuestions(new Date('2026-03-07'));
      expect(q1.map(q => q.question)).toEqual(q2.map(q => q.question));
    });

    it('異なる日付では異なる問題を返す', () => {
      const q1 = getDailyQuestions(new Date('2026-03-07'));
      const q2 = getDailyQuestions(new Date('2026-03-08'));
      // 5問全部同じになることはほぼありえない
      const texts1 = q1.map(q => q.question);
      const texts2 = q2.map(q => q.question);
      expect(texts1).not.toEqual(texts2);
    });

    it('各問題が必要なプロパティを持つ', () => {
      const questions = getDailyQuestions(new Date('2026-03-07'));
      questions.forEach(q => {
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('options');
        expect(q).toHaveProperty('answer');
      });
    });
  });

  describe('saveDailyResult / getDailyResult', () => {
    it('結果を保存して取得できる', () => {
      const result: DailyResult = {
        dateKey: '2026-03-07',
        correctCount: 4,
        totalCount: 5,
        timestamp: Date.now(),
      };
      saveDailyResult(result);
      const loaded = getDailyResult('2026-03-07');
      expect(loaded).toEqual(result);
    });

    it('存在しない日付はundefinedを返す', () => {
      expect(getDailyResult('2026-01-01')).toBeUndefined();
    });
  });

  describe('getDailyStreak', () => {
    it('連続参加日数を正しく計算する', () => {
      // 3日連続の結果を保存
      const base: Omit<DailyResult, 'dateKey'> = { correctCount: 3, totalCount: 5, timestamp: 0 };
      saveDailyResult({ ...base, dateKey: '2026-03-05' });
      saveDailyResult({ ...base, dateKey: '2026-03-06' });
      saveDailyResult({ ...base, dateKey: '2026-03-07' });

      expect(getDailyStreak(new Date('2026-03-07'))).toBe(3);
    });

    it('途切れた場合は途切れた以降の日数を返す', () => {
      const base: Omit<DailyResult, 'dateKey'> = { correctCount: 3, totalCount: 5, timestamp: 0 };
      saveDailyResult({ ...base, dateKey: '2026-03-04' });
      // 03-05 は欠落
      saveDailyResult({ ...base, dateKey: '2026-03-06' });
      saveDailyResult({ ...base, dateKey: '2026-03-07' });

      expect(getDailyStreak(new Date('2026-03-07'))).toBe(2);
    });

    it('当日の結果がない場合は0を返す', () => {
      expect(getDailyStreak(new Date('2026-03-07'))).toBe(0);
    });
  });
});
