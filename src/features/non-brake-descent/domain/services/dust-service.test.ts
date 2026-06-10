import { createDust } from './dust-service';

describe('dust-service', () => {
  // --- 正常系 ---

  describe('正常系: パーティクル生成', () => {
    it('count=5 のとき 5 個のパーティクルを生成する', () => {
      // Arrange / Act
      const result = createDust(100, 200, 5);
      // Assert
      expect(result).toHaveLength(5);
    });

    it('count=1 のとき 1 個のパーティクルを生成する', () => {
      // Arrange / Act
      const result = createDust(50, 100, 1);
      // Assert
      expect(result).toHaveLength(1);
    });

    it('生成した各パーティクルの life が 0 より大きい', () => {
      // Arrange / Act
      const result = createDust(100, 200, 4);
      // Assert
      result.forEach((p) => {
        expect(p.life).toBeGreaterThan(0);
      });
    });

    it('生成した各パーティクルに color プロパティが設定されている', () => {
      // Arrange / Act
      const result = createDust(100, 200, 3);
      // Assert
      result.forEach((p) => {
        expect(typeof p.color).toBe('string');
        expect(p.color.length).toBeGreaterThan(0);
      });
    });

    it('生成開始地点の近くに x, y が設定される', () => {
      // Arrange
      const originX = 100;
      const originY = 200;
      // Act
      const result = createDust(originX, originY, 6);
      // Assert: 生成点から大きく離れていないことを確認（散布範囲の上限は実装次第だが合理的な範囲）
      result.forEach((p) => {
        expect(Math.abs(p.x - originX)).toBeLessThan(100);
        expect(Math.abs(p.y - originY)).toBeLessThan(100);
      });
    });
  });

  // --- 正常系: 左右への分散 ---

  describe('正常系: vx が左右に分散する', () => {
    it('count=10 個生成したとき vx が正のものと負のものが両方存在する', () => {
      // Arrange
      // Math.random をモックして確定的にする
      let callCount = 0;
      const mockRandom = jest.spyOn(Math, 'random').mockImplementation(() => {
        // 0 → 0.3 → 0.7 の繰り返しで正負を確実に生成
        const values = [0.1, 0.9];
        const v = values[callCount % values.length];
        callCount++;
        return v;
      });

      // Act
      const result = createDust(100, 200, 10);

      // Assert: 左右への分散
      const hasPositiveVx = result.some((p) => p.vx > 0);
      const hasNegativeVx = result.some((p) => p.vx < 0);
      expect(hasPositiveVx).toBe(true);
      expect(hasNegativeVx).toBe(true);

      mockRandom.mockRestore();
    });
  });

  // --- 境界値: count=0 ---

  describe('境界値: count=0 の場合', () => {
    it('count=0 のとき空配列を返す', () => {
      // Arrange / Act
      const result = createDust(100, 200, 0);
      // Assert
      expect(result).toHaveLength(0);
    });
  });

  // --- 境界値: 大量生成 ---

  describe('境界値: 大量生成', () => {
    it('count=100 でも count 個生成できる', () => {
      // Arrange / Act
      const result = createDust(0, 0, 100);
      // Assert
      expect(result).toHaveLength(100);
    });
  });

  // --- 異常系: 各パーティクルの構造 ---

  describe('異常系: Particle 型の構造を満たしている', () => {
    it('生成したパーティクルが x, y, color, vx, vy, life フィールドを持つ', () => {
      // Arrange / Act
      const result = createDust(50, 80, 2);
      // Assert
      result.forEach((p) => {
        expect(p).toHaveProperty('x');
        expect(p).toHaveProperty('y');
        expect(p).toHaveProperty('color');
        expect(p).toHaveProperty('vx');
        expect(p).toHaveProperty('vy');
        expect(p).toHaveProperty('life');
      });
    });
  });
});
