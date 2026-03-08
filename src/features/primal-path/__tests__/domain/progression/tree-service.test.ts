/**
 * domain/progression/tree-service のテスト
 */
import { getTB, tbSummary, bestDiffLabel } from '../../../domain/progression/tree-service';
import { TB_DEFAULTS, FRESH_SAVE } from '../../../constants';

describe('domain/progression/tree-service', () => {
  describe('getTB', () => {
    it('空のツリーの場合デフォルト値を返す', () => {
      const tb = getTB({});
      expect(tb).toEqual(TB_DEFAULTS);
    });
  });

  describe('tbSummary', () => {
    it('デフォルトボーナスの場合空配列を返す', () => {
      expect(tbSummary({ ...TB_DEFAULTS })).toEqual([]);
    });

    it('ATKボーナスがある場合ATK+Nを含む', () => {
      const tb = { ...TB_DEFAULTS, bA: 5 };
      expect(tbSummary(tb)).toContain('ATK+5');
    });
  });

  describe('bestDiffLabel', () => {
    it('クリアした難易度がない場合は空文字を返す', () => {
      expect(bestDiffLabel({ ...FRESH_SAVE })).toBe('');
    });
  });
});
