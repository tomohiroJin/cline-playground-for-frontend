/**
 * constants/biome.ts のテスト
 * バイオーム関連の定数が正しくエクスポートされることを検証
 */
import { BIO, BIOME_COUNT, BIOME_AFFINITY, ENV_DMG } from '../../constants/biome';

describe('constants/biome', () => {
  describe('BIO（バイオーム情報）', () => {
    it('3種類のバイオームが定義されている', () => {
      expect(BIO).toHaveProperty('grassland');
      expect(BIO).toHaveProperty('glacier');
      expect(BIO).toHaveProperty('volcano');
    });

    it('各バイオームにアイコン・名前・説明がある', () => {
      Object.values(BIO).forEach(b => {
        expect(b).toHaveProperty('ic');
        expect(b).toHaveProperty('nm');
        expect(b).toHaveProperty('ds');
      });
    });
  });

  describe('BIOME_COUNT', () => {
    it('バイオーム数が3である', () => {
      expect(BIOME_COUNT).toBe(3);
    });
  });

  describe('BIOME_AFFINITY（バイオーム相性）', () => {
    it('各バイオームにcheck関数と倍率が定義されている', () => {
      expect(BIOME_AFFINITY.glacier.check).toBeInstanceOf(Function);
      expect(BIOME_AFFINITY.glacier.m).toBe(1.3);
      expect(BIOME_AFFINITY.volcano.m).toBe(1.3);
      expect(BIOME_AFFINITY.grassland.m).toBe(1.2);
    });
  });

  describe('ENV_DMG（環境ダメージ）', () => {
    it('氷河と火山の環境ダメージが定義されている', () => {
      expect(ENV_DMG).toHaveProperty('glacier');
      expect(ENV_DMG).toHaveProperty('volcano');
      expect(ENV_DMG.glacier.base).toBe(3);
      expect(ENV_DMG.volcano.base).toBe(2);
    });
  });
});
