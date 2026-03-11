/**
 * constants/awakening.ts のテスト
 */
import { AWK_SA, AWK_FA } from '../../constants/awakening';

describe('constants/awakening', () => {
  describe('AWK_SA（小覚醒）', () => {
    it('4つの文明タイプの小覚醒が定義されている', () => {
      expect(AWK_SA).toHaveProperty('tech');
      expect(AWK_SA).toHaveProperty('life');
      expect(AWK_SA).toHaveProperty('rit');
      expect(AWK_SA).toHaveProperty('bal');
    });

    it('各覚醒に名前と効果が定義されている', () => {
      Object.values(AWK_SA).forEach(a => {
        expect(a).toHaveProperty('nm');
        expect(a).toHaveProperty('fx');
      });
    });
  });

  describe('AWK_FA（大覚醒）', () => {
    it('4つの文明タイプの大覚醒が定義されている', () => {
      expect(AWK_FA).toHaveProperty('tech');
      expect(AWK_FA).toHaveProperty('life');
      expect(AWK_FA).toHaveProperty('rit');
      expect(AWK_FA).toHaveProperty('bal');
    });
  });
});
