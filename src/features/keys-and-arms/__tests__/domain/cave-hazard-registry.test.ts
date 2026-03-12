import { describe, it, expect } from 'vitest';
import { createCaveHazardRegistry } from '../../domain/enemies/cave-hazard-registry';

describe('CaveHazardRegistry', () => {
  describe('bat', () => {
    it('静止フェーズを正しく判定する', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act
      const result = registry.evaluate('bat', { beatCount: 0, hazardPeriod: 7 });

      // Assert
      expect(result.phase).toBe(0);
      expect(result.isDangerous).toBe(false);
    });

    it('危険フェーズを正しく判定する', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act — 周期7で70%以降は危険
      const result = registry.evaluate('bat', { beatCount: 6, hazardPeriod: 7 });

      // Assert
      expect(result.phase).toBe(2);
      expect(result.isDangerous).toBe(true);
    });
  });

  describe('spider', () => {
    it('静止フェーズを正しく判定する', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act
      const result = registry.evaluate('spider', { beatCount: 0, hazardPeriod: 7 });

      // Assert
      expect(result.isDangerous).toBe(false);
    });

    it('危険フェーズを正しく判定する', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act
      const result = registry.evaluate('spider', { beatCount: 6, hazardPeriod: 7 });

      // Assert
      expect(result.isDangerous).toBe(true);
    });
  });

  describe('trap', () => {
    it('通電中を正しく判定する', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act — 周期6で最後の2ビートは通電
      const result = registry.evaluate('trap', { beatCount: 5, hazardPeriod: 6 });

      // Assert
      expect(result.isDangerous).toBe(true);
    });

    it('非通電状態を正しく判定する', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act
      const result = registry.evaluate('trap', { beatCount: 0, hazardPeriod: 6 });

      // Assert
      expect(result.isDangerous).toBe(false);
    });
  });

  describe('mimic', () => {
    it('安全時を正しく判定する', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act
      const result = registry.evaluate('mimic', { beatCount: 0, hazardPeriod: 6 });

      // Assert
      expect(result.isDangerous).toBe(false);
    });
  });

  describe('未登録タイプ', () => {
    it('未登録タイプでエラーをスローする', () => {
      // Arrange
      const registry = createCaveHazardRegistry();

      // Act & Assert
      expect(() => registry.evaluate('unknown', { beatCount: 0, hazardPeriod: 6 }))
        .toThrow('[CaveHazardRegistry] 未登録のハザードタイプ: unknown');
    });
  });
});
