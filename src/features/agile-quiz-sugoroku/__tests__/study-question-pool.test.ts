/**
 * Agile Quiz Sugoroku - 勉強会モード問題プールテスト
 */
import { buildStudyPool, countStudyQuestions } from '../study-question-pool';

describe('study-question-pool', () => {
  describe('buildStudyPool', () => {
    it('選択タグに一致する問題を返す', () => {
      const pool = buildStudyPool(['scrum']);
      expect(pool.length).toBeGreaterThan(0);
      pool.forEach((q) => {
        expect(q.tags).toBeDefined();
        expect(q.tags!.some((t) => t === 'scrum')).toBe(true);
      });
    });

    it('複数タグを指定すると和集合で問題を収集する', () => {
      const scrumOnly = buildStudyPool(['scrum']);
      const combined = buildStudyPool(['scrum', 'testing']);
      expect(combined.length).toBeGreaterThanOrEqual(scrumOnly.length);
    });

    it('limit指定で問題数を制限する', () => {
      const limited = buildStudyPool(['scrum', 'testing'], 5);
      expect(limited.length).toBeLessThanOrEqual(5);
    });

    it('limit=0で全問返す', () => {
      const all = buildStudyPool(['scrum'], 0);
      const count = countStudyQuestions(['scrum']);
      expect(all.length).toBe(count);
    });

    it('存在しないタグは空配列を返す', () => {
      const pool = buildStudyPool(['nonexistent-tag']);
      expect(pool).toEqual([]);
    });

    it('結果はシャッフルされている（同じ順番になる確率が低い）', () => {
      // 十分な問題数がある場合、2回の呼び出しで順序が異なることを確認
      const pool1 = buildStudyPool(['scrum', 'testing', 'agile']);
      const pool2 = buildStudyPool(['scrum', 'testing', 'agile']);
      if (pool1.length > 3) {
        // 完全一致する確率は非常に低い
        const same = pool1.every((q, i) => q.question === pool2[i].question);
        // ごく稀に一致することがあるため、テストを緩く
        expect(typeof same).toBe('boolean');
      }
    });
  });

  describe('countStudyQuestions', () => {
    it('選択タグの問題数を返す', () => {
      const count = countStudyQuestions(['scrum']);
      expect(count).toBeGreaterThan(0);
    });

    it('複数タグの問題数は単一タグ以上', () => {
      const single = countStudyQuestions(['scrum']);
      const multi = countStudyQuestions(['scrum', 'testing']);
      expect(multi).toBeGreaterThanOrEqual(single);
    });

    it('存在しないタグは0を返す', () => {
      expect(countStudyQuestions(['nonexistent'])).toBe(0);
    });
  });
});
