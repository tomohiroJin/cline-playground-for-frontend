import { sampleTrail, TrailSample } from './trail-service';

describe('trail-service', () => {
  // --- 正常系 ---

  describe('正常系: サンプルの追加と管理', () => {
    it('新しいサンプルが先頭（index=0）に追加される', () => {
      // Arrange
      const existing: TrailSample[] = [];
      // Act
      const result = sampleTrail(existing, 100, 200, 5);
      // Assert
      expect(result[0]).toMatchObject({ x: 100, y: 200 });
    });

    it('既存サンプルが2番目以降にシフトされる', () => {
      // Arrange
      const existing: TrailSample[] = [{ x: 50, y: 60, opacity: 1.0 }];
      // Act
      const result = sampleTrail(existing, 100, 200, 5);
      // Assert
      expect(result[0]).toMatchObject({ x: 100, y: 200 });
      expect(result[1]).toMatchObject({ x: 50, y: 60 });
    });

    it('結果の長さが maxLen を超えない', () => {
      // Arrange
      const existing: TrailSample[] = [
        { x: 1, y: 1, opacity: 1.0 },
        { x: 2, y: 2, opacity: 0.8 },
        { x: 3, y: 3, opacity: 0.6 },
      ];
      const maxLen = 3;
      // Act
      const result = sampleTrail(existing, 0, 0, maxLen);
      // Assert
      expect(result.length).toBe(maxLen);
    });

    it('空の既存配列から1件追加されると length が 1 になる', () => {
      // Arrange
      const existing: TrailSample[] = [];
      // Act
      const result = sampleTrail(existing, 10, 20, 5);
      // Assert
      expect(result.length).toBe(1);
    });
  });

  // --- 境界値 ---

  describe('境界値: maxLen=0 の場合', () => {
    it('maxLen=0 のとき空配列を返す', () => {
      // Arrange
      const existing: TrailSample[] = [];
      // Act
      const result = sampleTrail(existing, 10, 20, 0);
      // Assert
      expect(result).toHaveLength(0);
    });

    it('既存サンプルがあっても maxLen=0 なら空配列を返す', () => {
      // Arrange
      const existing: TrailSample[] = [{ x: 1, y: 1, opacity: 1.0 }];
      // Act
      const result = sampleTrail(existing, 10, 20, 0);
      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('境界値: maxLen=1 の場合', () => {
    it('maxLen=1 のとき新しいサンプルだけが返る', () => {
      // Arrange
      const existing: TrailSample[] = [{ x: 99, y: 99, opacity: 0.5 }];
      // Act
      const result = sampleTrail(existing, 10, 20, 1);
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ x: 10, y: 20 });
    });
  });

  // --- 正常系: opacity の減衰 ---

  describe('正常系: opacity の減衰', () => {
    it('先頭サンプルの opacity が最も高く、後ろほど低い（単調減少）', () => {
      // Arrange: 3サンプルを蓄積する
      let trail: TrailSample[] = [];
      trail = sampleTrail(trail, 0, 0, 5); // [sample0]
      trail = sampleTrail(trail, 1, 1, 5); // [sample1, sample0_faded]
      trail = sampleTrail(trail, 2, 2, 5); // [sample2, sample1_faded, sample0_more_faded]
      // Act / Assert: index が増えるほど opacity が低い（または同じ）
      for (let i = 0; i < trail.length - 1; i++) {
        expect(trail[i].opacity).toBeGreaterThanOrEqual(trail[i + 1].opacity);
      }
    });

    it('複数回 sampleTrail すると後ろのサンプルの opacity が先頭より低い', () => {
      // Arrange
      const existing: TrailSample[] = [{ x: 0, y: 0, opacity: 0.8 }];
      // Act
      const result = sampleTrail(existing, 1, 1, 5);
      // Assert: 先頭（新規）> インデックス1（既存）
      expect(result[0].opacity).toBeGreaterThan(result[1].opacity);
    });
  });

  // --- 異常系: 不変性の確認 ---

  describe('異常系: 入力配列を変更しない（イミュータブル）', () => {
    it('元の existing 配列が変更されない', () => {
      // Arrange
      const existing: TrailSample[] = [{ x: 10, y: 20, opacity: 1.0 }];
      const originalLength = existing.length;
      // Act
      sampleTrail(existing, 30, 40, 5);
      // Assert
      expect(existing.length).toBe(originalLength);
      expect(existing[0]).toMatchObject({ x: 10, y: 20 });
    });
  });
});
