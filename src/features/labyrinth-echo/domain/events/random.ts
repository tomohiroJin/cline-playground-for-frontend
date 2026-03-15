/**
 * 迷宮の残響 - 乱数ソース抽象化
 *
 * 乱数の注入可能化によりテストの決定論的再現を実現する。
 */

/** 乱数ソースのインターフェース */
export interface RandomSource {
  /** 0以上1未満の乱数を返す（Math.random()と同じ契約） */
  random(): number;
}

/** デフォルト乱数ソース（本番用） */
export class DefaultRandomSource implements RandomSource {
  random(): number {
    return Math.random();
  }
}

/**
 * seed固定乱数ソース（テスト・デバッグ用）
 * 同一seedからは常に同一の乱数列が生成される
 * アルゴリズム: xorshift32（軽量・十分な品質）
 */
export class SeededRandomSource implements RandomSource {
  private state: number;

  constructor(seed: number) {
    // seed=0の場合は1に変換（xorshiftは0を避ける必要がある）
    this.state = seed === 0 ? 1 : seed;
  }

  random(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 0x100000000;
  }
}

/** 乱数ソース注入可能なshuffle（Fisher-Yatesアルゴリズム） */
export const shuffleWith = <T>(array: readonly T[], rng: RandomSource = new DefaultRandomSource()): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
