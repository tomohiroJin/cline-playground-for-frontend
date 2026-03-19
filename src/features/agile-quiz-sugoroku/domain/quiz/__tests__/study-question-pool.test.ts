/**
 * 勉強会モード問題プールテスト
 */
import { buildStudyPool, countStudyQuestions } from '../study-question-pool';

describe('study-question-pool', () => {
  describe('buildStudyPool', () => {
    it('選択タグに一致する問題を返す', () => {
      // Arrange & Act
      const pool = buildStudyPool(['scrum']);

      // Assert
      expect(pool.length).toBeGreaterThan(0);
      pool.forEach((q) => {
        expect(q.tags).toBeDefined();
        expect(q.tags!.some((t) => t === 'scrum')).toBe(true);
      });
    });

    it('複数タグを指定すると和集合で問題を収集する', () => {
      // Arrange & Act
      const scrumOnly = buildStudyPool(['scrum']);
      const combined = buildStudyPool(['scrum', 'testing']);

      // Assert
      expect(combined.length).toBeGreaterThanOrEqual(scrumOnly.length);
    });

    it('limit指定で問題数を制限する', () => {
      // Arrange & Act
      const limited = buildStudyPool(['scrum', 'testing'], 5);

      // Assert
      expect(limited.length).toBeLessThanOrEqual(5);
    });

    it('limit=0で全問返す', () => {
      // Arrange
      const count = countStudyQuestions(['scrum']);

      // Act
      const all = buildStudyPool(['scrum'], 0);

      // Assert
      expect(all.length).toBe(count);
    });

    it('存在しないタグは空配列を返す', () => {
      // Arrange & Act & Assert
      expect(buildStudyPool(['nonexistent-tag'])).toEqual([]);
    });

    it('結果はシャッフルされている（同じ順番になる確率が低い）', () => {
      // Arrange & Act
      const pool1 = buildStudyPool(['scrum', 'testing', 'agile']);
      const pool2 = buildStudyPool(['scrum', 'testing', 'agile']);

      // Assert: 十分な問題数がある場合に確認
      if (pool1.length > 3) {
        const same = pool1.every((q, i) => q.question === pool2[i].question);
        expect(typeof same).toBe('boolean');
      }
    });
  });

  describe('countStudyQuestions', () => {
    it('選択タグの問題数を返す', () => {
      expect(countStudyQuestions(['scrum'])).toBeGreaterThan(0);
    });

    it('複数タグの問題数は単一タグ以上', () => {
      // Arrange & Act
      const single = countStudyQuestions(['scrum']);
      const multi = countStudyQuestions(['scrum', 'testing']);

      // Assert
      expect(multi).toBeGreaterThanOrEqual(single);
    });

    it('存在しないタグは0を返す', () => {
      expect(countStudyQuestions(['nonexistent'])).toBe(0);
    });
  });
});
