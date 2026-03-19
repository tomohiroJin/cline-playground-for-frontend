/**
 * シード付き乱数アダプター（テスト用）
 *
 * RandomPort インターフェースを xorshift32 で実装する。
 * 同じシードから同じ乱数列を生成し、再現可能なテストを実現。
 */
import { AbstractRandomAdapter } from './abstract-random-adapter';

export class SeededRandomAdapter extends AbstractRandomAdapter {
  private state: number;

  constructor(seed: number) {
    super();
    this.state = seed | 0;
    if (this.state === 0) this.state = 1;
  }

  /** 0以上1未満の乱数を返す（xorshift32） */
  random(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 4294967296;
  }
}
