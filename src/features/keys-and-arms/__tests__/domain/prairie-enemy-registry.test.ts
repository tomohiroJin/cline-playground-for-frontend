import { describe, it, expect } from 'vitest';
import { createPrairieEnemyRegistry } from '../../domain/enemies/prairie-enemy-registry';
import type { PrairieEnemyState } from '../../domain/enemies/prairie-enemy-registry';

/** テスト用のデフォルト敵状態を生成 */
function createTestEnemy(overrides: Partial<PrairieEnemyState> = {}): PrairieEnemyState {
  return {
    beh: 'normal',
    lane: 1,
    step: 3,
    dead: false,
    spawnT: 0,
    wait: 0,
    shiftDir: 0,
    shifted: false,
    dashReady: false,
    dashFlash: 0,
    ...overrides,
  };
}

const context = { maxLanes: 3 };

describe('PrairieEnemyRegistry', () => {
  describe('normal', () => {
    it('毎ビート1歩前進する', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'normal', step: 3 });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.step).toBe(2);
    });

    it('出現中は移動しない', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'normal', step: 3, spawnT: 2 });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.step).toBe(3);
    });

    it('dead の敵は移動しない', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'normal', step: 3, dead: true });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.step).toBe(3);
    });
  });

  describe('shifter', () => {
    it('step 2 でレーン移動する', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'shifter', step: 2, lane: 0, shiftDir: 1, shifted: false });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.lane).toBe(1);
      expect(result.shifted).toBe(true);
    });

    it('移動済みの場合は step を減少する', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'shifter', step: 2, shifted: true });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.step).toBe(1);
    });

    it('レーン上限を超えない', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'shifter', step: 2, lane: 2, shiftDir: 1, shifted: false });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.lane).toBe(2);
    });
  });

  describe('dasher', () => {
    it('step 2 で充電状態になる', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'dasher', step: 2, dashReady: false });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.dashReady).toBe(true);
      expect(result.dashFlash).toBe(4);
    });

    it('充電済みで step 0 に突進する', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'dasher', step: 2, dashReady: true });

      // Act
      const result = registry.update(enemy, context);

      // Assert
      expect(result.step).toBe(0);
      expect(result.dashReady).toBe(false);
    });
  });

  describe('未登録タイプ', () => {
    it('未登録タイプでエラーをスローする', () => {
      // Arrange
      const registry = createPrairieEnemyRegistry();
      const enemy = createTestEnemy({ beh: 'unknown' });

      // Act & Assert
      expect(() => registry.update(enemy, context))
        .toThrow('[EnemyRegistry] 未登録の敵タイプ: unknown');
    });
  });
});
