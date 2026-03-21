// ============================================================================
// Deep Sea Interceptor - ドメインエンティティのテスト
// ============================================================================

import {
  createPosition,
  addPosition,
  clampPosition,
  distanceBetween,
  isBossType,
  isMidbossType,
  applyDamage,
} from '../domain/entities';
import { buildEnemy } from '../test-factories';

describe('Position 値オブジェクト', () => {
  describe('createPosition', () => {
    describe('正常系', () => {
      it('有限数値で Position を生成できること', () => {
        // Arrange & Act
        const pos = createPosition(100, 200);

        // Assert
        expect(pos.x).toBe(100);
        expect(pos.y).toBe(200);
      });
    });

    describe('異常系', () => {
      it('NaN を渡すとエラーが発生すること', () => {
        // Act & Assert
        expect(() => createPosition(NaN, 0)).toThrow('有限数値');
      });

      it('Infinity を渡すとエラーが発生すること', () => {
        // Act & Assert
        expect(() => createPosition(0, Infinity)).toThrow('有限数値');
      });
    });
  });

  describe('addPosition', () => {
    it('2つの Position を加算できること', () => {
      // Arrange
      const a = { x: 10, y: 20 };
      const b = { x: 5, y: -10 };

      // Act
      const result = addPosition(a, b);

      // Assert
      expect(result.x).toBe(15);
      expect(result.y).toBe(10);
    });
  });

  describe('clampPosition', () => {
    it('範囲内の Position はそのまま返されること', () => {
      // Arrange
      const pos = { x: 50, y: 50 };
      const bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };

      // Act
      const result = clampPosition(pos, bounds);

      // Assert
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it('範囲外の Position がクランプされること', () => {
      // Arrange
      const pos = { x: -10, y: 150 };
      const bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };

      // Act
      const result = clampPosition(pos, bounds);

      // Assert
      expect(result.x).toBe(0);
      expect(result.y).toBe(100);
    });
  });

  describe('distanceBetween', () => {
    it('2点間の距離を正しく計算すること', () => {
      // Arrange
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };

      // Act
      const result = distanceBetween(a, b);

      // Assert
      expect(result).toBe(5);
    });

    it('同じ位置の距離は0であること', () => {
      // Arrange
      const a = { x: 100, y: 200 };

      // Act
      const result = distanceBetween(a, a);

      // Assert
      expect(result).toBe(0);
    });
  });
});

describe('Enemy エンティティ', () => {
  describe('isBossType', () => {
    it('boss タイプを正しく判定すること', () => {
      expect(isBossType('boss')).toBe(true);
      expect(isBossType('boss1')).toBe(true);
      expect(isBossType('boss5')).toBe(true);
    });

    it('通常敵タイプはボスでないこと', () => {
      expect(isBossType('basic')).toBe(false);
      expect(isBossType('fast')).toBe(false);
    });

    it('ミッドボスタイプはボスでないこと', () => {
      expect(isBossType('midboss1')).toBe(false);
    });
  });

  describe('isMidbossType', () => {
    it('midboss タイプを正しく判定すること', () => {
      expect(isMidbossType('midboss1')).toBe(true);
      expect(isMidbossType('midboss5')).toBe(true);
    });

    it('通常敵やボスはミッドボスでないこと', () => {
      expect(isMidbossType('basic')).toBe(false);
      expect(isMidbossType('boss1')).toBe(false);
    });
  });

  describe('applyDamage', () => {
    describe('正常系', () => {
      it('ダメージ適用後のHPが正しいこと', () => {
        // Arrange
        const enemy = buildEnemy({ hp: 10, maxHp: 10 });

        // Act
        const result = applyDamage(enemy, 3);

        // Assert
        expect(result.hp).toBe(7);
      });

      it('HPが0以下にならないこと', () => {
        // Arrange
        const enemy = buildEnemy({ hp: 2, maxHp: 10 });

        // Act
        const result = applyDamage(enemy, 5);

        // Assert
        expect(result.hp).toBe(0);
      });

      it('元のエンティティが変更されないこと（イミュータブル）', () => {
        // Arrange
        const enemy = buildEnemy({ hp: 10, maxHp: 10 });

        // Act
        applyDamage(enemy, 3);

        // Assert
        expect(enemy.hp).toBe(10);
      });
    });

    describe('異常系', () => {
      it('負のダメージでエラーが発生すること', () => {
        // Arrange
        const enemy = buildEnemy({ hp: 10, maxHp: 10 });

        // Act & Assert
        expect(() => applyDamage(enemy, -1)).toThrow('0 以上');
      });
    });
  });
});
