import type { SaveData } from '../../types';
import { addPoints, spendPoints } from './point-ops';

// テスト用デフォルトデータ
const createDefault = (overrides?: Partial<SaveData>): SaveData => ({
  pts: 0,
  plays: 0,
  best: 0,
  bestSt: 0,
  sty: ['standard'],
  ui: [],
  eq: ['standard'],
  ...overrides,
});

describe('point-ops', () => {
  describe('addPoints', () => {
    it('PT を加算した新しい SaveData を返す', () => {
      // Arrange
      const data = createDefault({ pts: 100 });

      // Act
      const result = addPoints(data, 50);

      // Assert
      expect(result.pts).toBe(150);
    });

    it('元のデータを変更しない', () => {
      // Arrange
      const data = createDefault({ pts: 100 });

      // Act
      addPoints(data, 50);

      // Assert
      expect(data.pts).toBe(100);
    });

    it('0 を加算しても正しく動作する', () => {
      // Arrange
      const data = createDefault({ pts: 50 });

      // Act
      const result = addPoints(data, 0);

      // Assert
      expect(result.pts).toBe(50);
    });
  });

  describe('spendPoints', () => {
    it('残高が十分な場合、消費した新しい SaveData を返す', () => {
      // Arrange
      const data = createDefault({ pts: 100 });

      // Act
      const result = spendPoints(data, 30);

      // Assert
      expect(result).toBeDefined();
      expect(result!.pts).toBe(70);
    });

    it('残高不足の場合、undefined を返す', () => {
      // Arrange
      const data = createDefault({ pts: 20 });

      // Act
      const result = spendPoints(data, 50);

      // Assert
      expect(result).toBeUndefined();
    });

    it('残高と同額を消費できる', () => {
      // Arrange
      const data = createDefault({ pts: 50 });

      // Act
      const result = spendPoints(data, 50);

      // Assert
      expect(result).toBeDefined();
      expect(result!.pts).toBe(0);
    });

    it('元のデータを変更しない', () => {
      // Arrange
      const data = createDefault({ pts: 100 });

      // Act
      spendPoints(data, 30);

      // Assert
      expect(data.pts).toBe(100);
    });
  });
});
