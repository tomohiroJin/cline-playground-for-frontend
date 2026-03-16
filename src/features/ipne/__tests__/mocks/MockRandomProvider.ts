/**
 * テスト用乱数プロバイダーモック
 */
import { RandomProvider } from '../../domain/ports';

export class MockRandomProvider implements RandomProvider {
  private values: number[];
  private index = 0;

  /**
   * @param values 固定値または固定値の配列。配列が尽きたら最後の値を繰り返す
   */
  constructor(values: number | number[]) {
    this.values = Array.isArray(values) ? values : [values];
  }

  random(): number {
    const value = this.values[Math.min(this.index, this.values.length - 1)];
    this.index++;
    return value;
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('pick: 空の配列からは選択できません');
    }
    const index = Math.floor(this.random() * array.length);
    return array[index];
  }

  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** インデックスをリセットする */
  reset(): void {
    this.index = 0;
  }
}
