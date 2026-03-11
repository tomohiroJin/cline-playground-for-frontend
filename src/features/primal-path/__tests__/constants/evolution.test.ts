/**
 * constants/evolution.ts のテスト
 * 進化関連の定数が正しくエクスポートされることを検証
 */
import { EVOS, SYNERGY_BONUSES, SYNERGY_TAG_INFO } from '../../constants/evolution';

describe('constants/evolution', () => {
  describe('EVOS（進化一覧）', () => {
    it('進化カードが定義されている', () => {
      expect(EVOS.length).toBeGreaterThanOrEqual(24);
    });

    it('各文明タイプの進化が存在する', () => {
      const types = new Set(EVOS.map(e => e.t));
      expect(types).toContain('tech');
      expect(types).toContain('life');
      expect(types).toContain('rit');
    });

    it('各進化にタグが付与されている', () => {
      EVOS.forEach(evo => {
        expect(evo.tags).toBeDefined();
        expect(evo.tags!.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('SYNERGY_BONUSES（シナジーボーナス）', () => {
    it('8種類のシナジーが定義されている', () => {
      expect(SYNERGY_BONUSES).toHaveLength(8);
    });

    it('各シナジーにtier1とtier2が定義されている', () => {
      SYNERGY_BONUSES.forEach(s => {
        expect(s).toHaveProperty('tier1');
        expect(s).toHaveProperty('tier2');
      });
    });
  });

  describe('SYNERGY_TAG_INFO（シナジータグ表示情報）', () => {
    it('全タグの表示情報が定義されている', () => {
      const expectedTags = ['fire', 'ice', 'regen', 'shield', 'hunt', 'spirit', 'tribe', 'wild'];
      expectedTags.forEach(tag => {
        expect(SYNERGY_TAG_INFO).toHaveProperty(tag);
        expect(SYNERGY_TAG_INFO[tag]).toHaveProperty('ic');
        expect(SYNERGY_TAG_INFO[tag]).toHaveProperty('nm');
        expect(SYNERGY_TAG_INFO[tag]).toHaveProperty('cl');
      });
    });
  });
});
