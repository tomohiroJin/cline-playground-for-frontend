/**
 * constants/ui.ts のテスト
 */
import {
  CIV_TYPES, CIV_KEYS, TC, TN, CAT_CL,
  LOG_COLORS, TB_SUMMARY, TB_DEFAULTS, TB_KEY_COLOR,
} from '../../constants/ui';

describe('constants/ui', () => {
  describe('CIV_TYPES', () => {
    it('3つの文明タイプが定義されている', () => {
      expect(CIV_TYPES).toEqual(['tech', 'life', 'rit']);
    });
  });

  describe('CIV_KEYS', () => {
    it('文明タイプとキーのマッピングが定義されている', () => {
      expect(CIV_KEYS.tech).toBe('cT');
      expect(CIV_KEYS.life).toBe('cL');
      expect(CIV_KEYS.rit).toBe('cR');
    });
  });

  describe('TC / TN（文明カラー / 文明名）', () => {
    it('4つの文明タイプ拡張のカラーと名前が定義されている', () => {
      expect(Object.keys(TC)).toHaveLength(4);
      expect(Object.keys(TN)).toHaveLength(4);
    });
  });

  describe('CAT_CL（カテゴリカラー）', () => {
    it('カテゴリカラーが定義されている', () => {
      expect(CAT_CL).toHaveProperty('atk');
      expect(CAT_CL).toHaveProperty('hp');
    });
  });

  describe('LOG_COLORS', () => {
    it('ログカラーが定義されている', () => {
      expect(LOG_COLORS).toHaveProperty('gc');
      expect(LOG_COLORS).toHaveProperty('xc');
    });
  });

  describe('TB_SUMMARY / TB_DEFAULTS', () => {
    it('TB_SUMMARYが定義されている', () => {
      expect(TB_SUMMARY.length).toBeGreaterThanOrEqual(1);
    });

    it('TB_DEFAULTSが定義されている', () => {
      expect(TB_DEFAULTS).toHaveProperty('bA');
      expect(TB_DEFAULTS.bA).toBe(0);
    });
  });

  describe('TB_KEY_COLOR', () => {
    it('ツリーボーナスキーカラーが定義されている', () => {
      expect(TB_KEY_COLOR).toBeDefined();
    });
  });
});
