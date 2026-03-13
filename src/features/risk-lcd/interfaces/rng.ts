// RNG（乱数）API インターフェース
export interface RngApi {
  int(n: number): number;
  pick<T>(a: readonly T[]): T;
  chance(p: number): boolean;
  shuffle<T>(a: readonly T[]): T[];
  /** wPick 用の 0〜1 乱数 */
  random(): number;
}
