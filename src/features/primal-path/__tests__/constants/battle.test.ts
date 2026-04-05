/**
 * constants/battle.ts のテスト
 * 戦闘関連の定数が正しくエクスポートされることを検証
 */
import {
  ENM, BOSS, BOSS_CHAIN_SCALE, FINAL_BOSS_ORDER,
  SPEED_OPTS, WAVES_PER_BIOME, ENEMY_COLORS, ENEMY_DETAILS, ENEMY_SMALL_DETAILS,
} from '../../constants/battle';

describe('constants/battle', () => {
  describe('ENM（通常敵テンプレート）', () => {
    it('全バイオームの敵テンプレートが定義されている', () => {
      expect(ENM).toHaveProperty('grassland');
      expect(ENM).toHaveProperty('glacier');
      expect(ENM).toHaveProperty('volcano');
    });

    it('各バイオームに複数の敵が存在する', () => {
      expect(ENM.grassland.length).toBeGreaterThanOrEqual(1);
      expect(ENM.glacier.length).toBeGreaterThanOrEqual(1);
      expect(ENM.volcano.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('BOSS（ボステンプレート）', () => {
    it('バイオームボスと最終ボスが定義されている', () => {
      expect(BOSS).toHaveProperty('grassland');
      expect(BOSS).toHaveProperty('glacier');
      expect(BOSS).toHaveProperty('volcano');
      expect(BOSS).toHaveProperty('ft');
      expect(BOSS).toHaveProperty('fx');
    });
  });

  describe('BOSS_CHAIN_SCALE（ボス連戦スケール）', () => {
    it('5段階のスケール倍率が定義されている', () => {
      expect(BOSS_CHAIN_SCALE).toHaveLength(5);
      expect(BOSS_CHAIN_SCALE[0]).toBe(1.0);
    });
  });

  describe('FINAL_BOSS_ORDER（最終ボス出現順）', () => {
    it('4つの初回ボスキー（tech/life/rit/bal）に対する出現順が定義されている', () => {
      expect(Object.keys(FINAL_BOSS_ORDER)).toHaveLength(4);
      expect(FINAL_BOSS_ORDER.ft).toHaveLength(5);
      expect(FINAL_BOSS_ORDER.fb).toHaveLength(5);
    });
  });

  describe('SPEED_OPTS（速度オプション）', () => {
    it('5段階の速度設定が定義されている', () => {
      expect(SPEED_OPTS).toHaveLength(5);
    });
  });

  describe('WAVES_PER_BIOME', () => {
    it('バイオームあたりのウェーブ数が定義されている', () => {
      expect(WAVES_PER_BIOME).toBe(4);
    });
  });

  describe('ENEMY_COLORS（敵カラー）', () => {
    it('敵名に対するカラーが定義されている', () => {
      expect(ENEMY_COLORS).toHaveProperty('野ウサギ');
      expect(ENEMY_COLORS).toHaveProperty('マンモス');
    });
  });

  describe('ENEMY_DETAILS / ENEMY_SMALL_DETAILS', () => {
    it('敵詳細パーツが配列として定義されている', () => {
      expect(Array.isArray(ENEMY_DETAILS)).toBe(true);
      expect(Array.isArray(ENEMY_SMALL_DETAILS)).toBe(true);
    });
  });
});
