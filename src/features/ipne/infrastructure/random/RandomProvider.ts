/**
 * 乱数抽象
 */

export interface RandomProvider {
  next(): number;
}

export const MATH_RANDOM_PROVIDER: RandomProvider = {
  next: () => Math.random(),
};
