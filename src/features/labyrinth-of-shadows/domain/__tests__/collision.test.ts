import { isPlayerNearItem, isPlayerNearExit, isPlayerCollidingEnemy } from '../services/collision';

describe('domain/services/collision', () => {
  describe('isPlayerNearItem', () => {
    test('プレイヤーがアイテムの中心にいる場合、取得範囲内と判定される', () => {
      // Arrange: アイテム (3,3) の中心は (3.5, 3.5)
      // Act & Assert
      expect(isPlayerNearItem(3.5, 3.5, 3, 3)).toBe(true);
    });

    test('プレイヤーがアイテムから遠い場合、取得範囲外と判定される', () => {
      expect(isPlayerNearItem(1.5, 1.5, 5, 5)).toBe(false);
    });

    test('境界値: 取得距離ちょうどの場合、範囲外と判定される', () => {
      // distance = 0.5 の場合、< 0.5 は false
      expect(isPlayerNearItem(3.0, 3.5, 3, 3)).toBe(false);
    });

    test('境界値: 取得距離より少し近い場合、範囲内と判定される', () => {
      // (3.01, 3.5) → アイテム中心 (3.5, 3.5) との距離 = 0.49
      expect(isPlayerNearItem(3.01, 3.5, 3, 3)).toBe(true);
    });
  });

  describe('isPlayerNearExit', () => {
    test('プレイヤーが出口の位置にいる場合、到達と判定される', () => {
      expect(isPlayerNearExit(7.5, 7.5, 7.5, 7.5)).toBe(true);
    });

    test('プレイヤーが出口から遠い場合、未到達と判定される', () => {
      expect(isPlayerNearExit(1.5, 1.5, 7.5, 7.5)).toBe(false);
    });

    test('境界値: 出口距離ちょうどの場合、範囲外と判定される', () => {
      // distance = 0.55 の場合、< 0.55 は false
      expect(isPlayerNearExit(7.5, 7.5 + 0.55, 7.5, 7.5)).toBe(false);
    });
  });

  describe('isPlayerCollidingEnemy', () => {
    test('プレイヤーと敵が同じ位置にいる場合、衝突と判定される', () => {
      expect(isPlayerCollidingEnemy(3.5, 3.5, 3.5, 3.5)).toBe(true);
    });

    test('プレイヤーと敵が遠い場合、非衝突と判定される', () => {
      expect(isPlayerCollidingEnemy(1.5, 1.5, 5.5, 5.5)).toBe(false);
    });

    test('境界値: 衝突距離ちょうどの場合、範囲外と判定される', () => {
      // distance = 0.45 の場合、< 0.45 は false
      expect(isPlayerCollidingEnemy(3.5, 3.5, 3.5 + 0.45, 3.5)).toBe(false);
    });

    test('境界値: 衝突距離より少し近い場合、衝突と判定される', () => {
      expect(isPlayerCollidingEnemy(3.5, 3.5, 3.5 + 0.44, 3.5)).toBe(true);
    });
  });
});
