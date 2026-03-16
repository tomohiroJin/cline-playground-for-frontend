/**
 * シナリオテスト用ヘルパー
 * 統合テスト・決定的シナリオテストで使用するユーティリティ
 */
import { RandomProvider } from '../../domain/ports';
import { TickGameStateInput } from '../../application/engine/tickGameState';
import { GAME_BALANCE } from '../../domain/config/gameBalance';
import { aPlayer, aMap } from '../builders';

/**
 * 固定シード乱数プロバイダー（xorshift ベース）
 * 同じシードからは常に同じ乱数列が生成される
 */
export class SeededRandomProvider implements RandomProvider {
  private state: number;

  constructor(seed: number) {
    // シードが0だとxorshiftが全て0を返すため、0以外にする
    this.state = seed === 0 ? 1 : seed;
  }

  random(): number {
    // xorshift32 アルゴリズム
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    // 0以上1未満に正規化（符号なし32ビット整数に変換）
    return (x >>> 0) / 0x100000000;
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
}

/**
 * テスト用 TickGameStateInput 生成（デフォルト値付き）
 */
export const createTestTickInput = (
  overrides?: Partial<TickGameStateInput>
): TickGameStateInput => ({
  map: aMap().build(),
  player: aPlayer().build(),
  enemies: [],
  items: [],
  traps: [],
  walls: [],
  pendingLevelPoints: 0,
  currentTime: 0,
  maxLevel: GAME_BALANCE.player.maxLevel,
  random: new SeededRandomProvider(42),
  ...overrides,
});
