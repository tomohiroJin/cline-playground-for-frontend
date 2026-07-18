/**
 * 灰燼の城壁 - シード付き乱数実装（mulberry32）
 */
import type { RandomPort } from '../../application/ports/random-port';

/** シード指定で決定的な乱数列を生成する */
export class SeededRandom implements RandomPort {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  random(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** 本番用の Math.random ラッパー */
export class DefaultRandom implements RandomPort {
  random(): number {
    return Math.random();
  }
}
