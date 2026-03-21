// DbC（契約による設計）アサーション関数
// 開発・テスト環境では有効、本番ビルドでは IS_DEV が false に置換され
// デッドコード除去（DCE）により関数本体が空になる

const IS_DEV = process.env.NODE_ENV !== 'production';

/** 汎用アサーション */
export function assert(condition: boolean, message?: string): asserts condition {
  if (IS_DEV && !condition) {
    throw new Error(`Assertion failed: ${message ?? 'unknown'}`);
  }
}

/** 範囲チェック */
export function assertInRange(value: number, min: number, max: number, name: string): void {
  if (IS_DEV && (value < min || value > max)) {
    throw new Error(`Assertion failed: ${name} = ${value} is not in [${min}, ${max}]`);
  }
}

/** 正の数チェック */
export function assertPositive(value: number, name: string): void {
  if (IS_DEV && value <= 0) {
    throw new Error(`Assertion failed: ${name} = ${value} is not positive`);
  }
}

/** 非負チェック */
export function assertNonNegative(value: number, name: string): void {
  if (IS_DEV && value < 0) {
    throw new Error(`Assertion failed: ${name} = ${value} is negative`);
  }
}

/** 非 null/undefined チェック */
export function assertDefined<T>(value: T | undefined | null, name: string): asserts value is T {
  if (IS_DEV && (value === undefined || value === null)) {
    throw new Error(`Assertion failed: ${name} is ${value}`);
  }
}

/** 配列インデックスの有効性チェック */
export function assertValidIndex(index: number, length: number, name: string): void {
  if (IS_DEV && !(Number.isInteger(index) && index >= 0 && index < length)) {
    throw new Error(`Assertion failed: ${name} = ${index} is not a valid index for length ${length}`);
  }
}
