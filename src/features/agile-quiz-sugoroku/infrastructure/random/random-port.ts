/**
 * 乱数生成のポートインターフェース
 *
 * Math.random を抽象化する。
 * テスト時は SeededRandomAdapter に差し替えて再現可能なテストを実現。
 */

/** 乱数生成のインターフェース */
export interface RandomPort {
  /** 0以上1未満の乱数を返す */
  random(): number;
  /** min 以上 max 以下のランダムな整数を返す */
  randomInt(min: number, max: number): number;
  /** 配列をシャッフルした新しい配列を返す（元の配列は変更しない） */
  shuffle<T>(array: readonly T[]): T[];
}
