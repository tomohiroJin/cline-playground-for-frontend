/**
 * DASHER AI のテスト
 */
import {
  createDasherEnemy,
  shouldDasherCharge,
  isDasherCharging,
} from '../../domain/enemies/dasher-behavior';

describe('enemies/dasher-behavior', () => {
  describe('createDasherEnemy', () => {
    it('dasher タイプで生成される', () => {
      const enemy = createDasherEnemy(2);
      expect(enemy.beh).toBe('dasher');
      expect(enemy.lane).toBe(2);
    });

    it('初期状態は充電していない', () => {
      const enemy = createDasherEnemy(0);
      expect(enemy.dashReady).toBe(false);
    });
  });

  describe('shouldDasherCharge', () => {
    it('step 2 で充電開始', () => {
      expect(shouldDasherCharge(2)).toBe(true);
    });

    it('step 2 以外では充電しない', () => {
      expect(shouldDasherCharge(0)).toBe(false);
      expect(shouldDasherCharge(1)).toBe(false);
      expect(shouldDasherCharge(3)).toBe(false);
    });
  });

  describe('isDasherCharging', () => {
    it('dashReady が true なら充電中', () => {
      expect(isDasherCharging(true)).toBe(true);
    });

    it('dashReady が false なら通常', () => {
      expect(isDasherCharging(false)).toBe(false);
    });
  });

  describe('DASHER 突進', () => {
    it('充電後は step 0 まで一気に進む（呼び出し側の責務）', () => {
      // ドメインは状態判定のみ — 実際の移動はステージロジックが制御
      expect(shouldDasherCharge(2)).toBe(true);
    });

    it('ステップ 3 で出現、2 で充電の流れ', () => {
      expect(shouldDasherCharge(3)).toBe(false);
      expect(shouldDasherCharge(2)).toBe(true);
    });
  });
});
