/**
 * シナリオテストヘルパーのテスト
 */
import { SeededRandomProvider, createTestTickInput } from './scenarioHelpers';

describe('SeededRandomProvider', () => {
  describe('決定性', () => {
    it('同じシードから同じ乱数列が生成される', () => {
      // Arrange
      const rng1 = new SeededRandomProvider(12345);
      const rng2 = new SeededRandomProvider(12345);

      // Act & Assert
      for (let i = 0; i < 20; i++) {
        expect(rng1.random()).toBe(rng2.random());
      }
    });

    it('異なるシードからは異なる乱数列が生成される', () => {
      // Arrange
      const rng1 = new SeededRandomProvider(12345);
      const rng2 = new SeededRandomProvider(54321);

      // Act
      const values1 = Array.from({ length: 10 }, () => rng1.random());
      const values2 = Array.from({ length: 10 }, () => rng2.random());

      // Assert: 少なくとも1つは異なる値が含まれる
      const allSame = values1.every((v, i) => v === values2[i]);
      expect(allSame).toBe(false);
    });
  });

  describe('random()', () => {
    it('0以上1未満の値を返す', () => {
      // Arrange
      const rng = new SeededRandomProvider(42);

      // Act & Assert
      for (let i = 0; i < 100; i++) {
        const val = rng.random();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('randomInt()', () => {
    it('min以上max未満の整数を返す', () => {
      // Arrange
      const rng = new SeededRandomProvider(42);

      // Act & Assert
      for (let i = 0; i < 100; i++) {
        const val = rng.randomInt(3, 10);
        expect(val).toBeGreaterThanOrEqual(3);
        expect(val).toBeLessThan(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });
  });

  describe('pick()', () => {
    it('配列からランダムに要素を選択する', () => {
      // Arrange
      const rng = new SeededRandomProvider(42);
      const items = ['a', 'b', 'c', 'd', 'e'];

      // Act
      const picked = rng.pick(items);

      // Assert
      expect(items).toContain(picked);
    });

    it('空の配列で呼ぶとエラーを投げる', () => {
      // Arrange
      const rng = new SeededRandomProvider(42);

      // Act & Assert
      expect(() => rng.pick([])).toThrow();
    });
  });

  describe('shuffle()', () => {
    it('元の配列と同じ要素を含む新しい配列を返す', () => {
      // Arrange
      const rng = new SeededRandomProvider(42);
      const original = [1, 2, 3, 4, 5];

      // Act
      const shuffled = rng.shuffle(original);

      // Assert
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('元の配列を変更しない', () => {
      // Arrange
      const rng = new SeededRandomProvider(42);
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];

      // Act
      rng.shuffle(original);

      // Assert
      expect(original).toEqual(copy);
    });
  });
});

describe('createTestTickInput', () => {
  it('デフォルト値で TickGameStateInput を生成する', () => {
    // Act
    const input = createTestTickInput();

    // Assert
    expect(input.currentTime).toBe(0);
    expect(input.maxLevel).toBe(22);
    expect(input.pendingLevelPoints).toBe(0);
    expect(input.player).toBeDefined();
    expect(input.map).toBeDefined();
    expect(input.enemies).toEqual([]);
    expect(input.items).toEqual([]);
    expect(input.traps).toEqual([]);
    expect(input.walls).toEqual([]);
    expect(input.random).toBeDefined();
  });

  it('オーバーライドを適用する', () => {
    // Act
    const input = createTestTickInput({
      currentTime: 5000,
      maxLevel: 10,
    });

    // Assert
    expect(input.currentTime).toBe(5000);
    expect(input.maxLevel).toBe(10);
  });
});
