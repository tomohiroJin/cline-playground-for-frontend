// DbC（契約による設計）アサーション関数
// 開発・テスト環境では有効、本番では Tree-shaking で除去

const IS_DEV = process.env.NODE_ENV !== 'production';

/** 汎用アサーション */
export function assert(condition: boolean, message?: string): asserts condition {
  if (IS_DEV && !condition) {
    throw new Error(`Assertion failed: ${message ?? 'unknown'}`);
  }
}

/** 範囲チェック */
export function assertInRange(value: number, min: number, max: number, name: string): void {
  assert(value >= min && value <= max, `${name} = ${value} is not in [${min}, ${max}]`);
}

/** 正の数チェック */
export function assertPositive(value: number, name: string): void {
  assert(value > 0, `${name} = ${value} is not positive`);
}

/** 非負チェック */
export function assertNonNegative(value: number, name: string): void {
  assert(value >= 0, `${name} = ${value} is negative`);
}

/** 非 null/undefined チェック */
export function assertDefined<T>(value: T | undefined | null, name: string): asserts value is T {
  assert(value !== undefined && value !== null, `${name} is ${value}`);
}

/** 配列インデックスの有効性チェック */
export function assertValidIndex(index: number, length: number, name: string): void {
  assert(
    Number.isInteger(index) && index >= 0 && index < length,
    `${name} = ${index} is not a valid index for length ${length}`,
  );
}
