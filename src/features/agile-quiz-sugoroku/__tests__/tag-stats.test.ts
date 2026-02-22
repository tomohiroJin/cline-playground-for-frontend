/**
 * Agile Quiz Sugoroku - ジャンル別統計ユーティリティテスト
 */
import { TagStats } from '../types';
import { computeTagStatEntries, getWeakGenres, getWeakGenreIds, getTagColor } from '../tag-stats';

describe('tag-stats', () => {
  const sampleStats: TagStats = {
    scrum: { correct: 8, total: 10 },
    agile: { correct: 5, total: 10 },
    testing: { correct: 3, total: 10 },
    'design-principles': { correct: 10, total: 10 },
    incident: { correct: 0, total: 5 },
  };

  describe('getTagColor', () => {
    it('70%以上は緑を返す', () => {
      expect(getTagColor(70)).toBe('#34d399');
      expect(getTagColor(100)).toBe('#34d399');
    });

    it('50-69%は黄色を返す', () => {
      expect(getTagColor(50)).toBe('#f0b040');
      expect(getTagColor(69)).toBe('#f0b040');
    });

    it('50%未満は赤を返す', () => {
      expect(getTagColor(49)).toBe('#f06070');
      expect(getTagColor(0)).toBe('#f06070');
    });
  });

  describe('computeTagStatEntries', () => {
    it('統計エントリを正答率昇順で返す', () => {
      const entries = computeTagStatEntries(sampleStats);
      expect(entries.length).toBe(5);
      expect(entries[0].tagId).toBe('incident'); // 0%
      expect(entries[entries.length - 1].tagId).toBe('design-principles'); // 100%
    });

    it('正答率を正しく計算する', () => {
      const entries = computeTagStatEntries(sampleStats);
      const scrumEntry = entries.find((e) => e.tagId === 'scrum');
      expect(scrumEntry?.rate).toBe(80);
    });

    it('強弱判定が正しい', () => {
      const entries = computeTagStatEntries(sampleStats);
      const strong = entries.find((e) => e.tagId === 'design-principles');
      const normal = entries.find((e) => e.tagId === 'agile');
      const weak = entries.find((e) => e.tagId === 'testing');
      expect(strong?.strength).toBe('strong');
      expect(normal?.strength).toBe('normal');
      expect(weak?.strength).toBe('weak');
    });

    it('total=0のエントリはフィルタされる', () => {
      const stats: TagStats = {
        scrum: { correct: 0, total: 0 },
        agile: { correct: 3, total: 5 },
      };
      const entries = computeTagStatEntries(stats);
      expect(entries.length).toBe(1);
      expect(entries[0].tagId).toBe('agile');
    });

    it('空の統計は空配列を返す', () => {
      expect(computeTagStatEntries({})).toEqual([]);
    });
  });

  describe('getWeakGenres', () => {
    it('50%以下のジャンルを返す', () => {
      const weak = getWeakGenres(sampleStats);
      expect(weak.length).toBe(2); // testing (30%), incident (0%)
      expect(weak.map((w) => w.tagId)).toContain('testing');
      expect(weak.map((w) => w.tagId)).toContain('incident');
    });

    it('苦手ジャンルがなければ空配列', () => {
      const goodStats: TagStats = {
        scrum: { correct: 8, total: 10 },
      };
      expect(getWeakGenres(goodStats)).toEqual([]);
    });
  });

  describe('getWeakGenreIds', () => {
    it('苦手ジャンルIDの配列を返す', () => {
      const ids = getWeakGenreIds(sampleStats);
      expect(ids).toContain('testing');
      expect(ids).toContain('incident');
      expect(ids).not.toContain('scrum');
    });
  });
});
