/**
 * 乱数プロバイダーインターフェース
 * 乱数生成を抽象化し、テスタビリティと決定性を向上させる
 */
export interface RandomProvider {
  /** 0以上1未満の乱数を返す */
  random(): number;
  /** min以上max未満の整数を返す */
  randomInt(min: number, max: number): number;
  /** 配列からランダムに1要素を選択する */
  pick<T>(array: readonly T[]): T;
  /** 配列をシャッフルした新しい配列を返す */
  shuffle<T>(array: readonly T[]): T[];
}
