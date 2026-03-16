/**
 * Math.random ベースの乱数プロバイダー
 * domain/ports/RandomProvider の実装
 */
import { RandomProvider } from '../../domain/ports';

export class MathRandomProvider implements RandomProvider {
  random(): number {
    return Math.random();
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('pick: 空の配列からは選択できません');
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
