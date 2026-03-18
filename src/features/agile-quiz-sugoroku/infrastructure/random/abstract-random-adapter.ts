/**
 * 乱数アダプターの共通基底クラス
 *
 * randomInt と shuffle の共通実装を提供する。
 * サブクラスは random() メソッドのみ実装すればよい。
 */
import { RandomPort } from './random-port';

export abstract class AbstractRandomAdapter implements RandomPort {
  /** 0以上1未満の乱数を返す（サブクラスで実装） */
  abstract random(): number;

  /** min 以上 max 以下のランダムな整数を返す */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /** 配列をシャッフルした新しい配列を返す（Fisher-Yates） */
  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
