/**
 * 乱数ソースの抽象化テスト
 */
import {
  SeededRandomSource,
  DefaultRandomSource,
  shuffleWith,
} from '../../../domain/events/random';

describe('SeededRandomSource', () => {
  it('同一seedで同一の乱数列が返る', () => {
    // Arrange
    const rng1 = new SeededRandomSource(42);
    const rng2 = new SeededRandomSource(42);

    // Act
    const sequence1 = Array.from({ length: 10 }, () => rng1.random());
    const sequence2 = Array.from({ length: 10 }, () => rng2.random());

    // Assert
    expect(sequence1).toEqual(sequence2);
  });

  it('異なるseedで異なる乱数列が返る', () => {
    // Arrange
    const rng1 = new SeededRandomSource(42);
    const rng2 = new SeededRandomSource(99);

    // Act
    const sequence1 = Array.from({ length: 10 }, () => rng1.random());
    const sequence2 = Array.from({ length: 10 }, () => rng2.random());

    // Assert
    expect(sequence1).not.toEqual(sequence2);
  });

  it('生成値が0以上1未満である（1000回生成）', () => {
    // Arrange
    const rng = new SeededRandomSource(12345);

    // Act
    const values = Array.from({ length: 1000 }, () => rng.random());

    // Assert
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('seed=0の場合でも動作する', () => {
    // Arrange
    const rng = new SeededRandomSource(0);

    // Act
    const values = Array.from({ length: 10 }, () => rng.random());

    // Assert
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
    // すべて同じ値にならないことを確認
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBeGreaterThan(1);
  });
});

describe('DefaultRandomSource', () => {
  it('値が0以上1未満である', () => {
    // Arrange
    const rng = new DefaultRandomSource();

    // Act
    const values = Array.from({ length: 100 }, () => rng.random());

    // Assert
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('shuffleWith', () => {
  it('固定seedで同一の結果が返る', () => {
    // Arrange
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng1 = new SeededRandomSource(42);
    const rng2 = new SeededRandomSource(42);

    // Act
    const result1 = shuffleWith(array, rng1);
    const result2 = shuffleWith(array, rng2);

    // Assert
    expect(result1).toEqual(result2);
  });

  it('全要素が保持される（要素の欠落・重複なし）', () => {
    // Arrange
    const array = [1, 2, 3, 4, 5];
    const rng = new SeededRandomSource(42);

    // Act
    const result = shuffleWith(array, rng);

    // Assert
    expect(result).toHaveLength(array.length);
    expect(result.sort((a, b) => a - b)).toEqual(
      [...array].sort((a, b) => a - b)
    );
  });

  it('空配列を渡すと空配列が返る', () => {
    // Arrange
    const array: number[] = [];
    const rng = new SeededRandomSource(42);

    // Act
    const result = shuffleWith(array, rng);

    // Assert
    expect(result).toEqual([]);
  });

  it('1要素配列はそのまま返る', () => {
    // Arrange
    const array = [42];
    const rng = new SeededRandomSource(42);

    // Act
    const result = shuffleWith(array, rng);

    // Assert
    expect(result).toEqual([42]);
  });

  it('元の配列が変更されない', () => {
    // Arrange
    const array = [1, 2, 3, 4, 5];
    const originalCopy = [...array];
    const rng = new SeededRandomSource(42);

    // Act
    shuffleWith(array, rng);

    // Assert
    expect(array).toEqual(originalCopy);
  });
});
