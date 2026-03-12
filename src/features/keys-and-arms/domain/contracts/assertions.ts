/**
 * DbC（契約による設計）アサーション関数
 *
 * 事前条件・事後条件・不変条件のチェックに使用する。
 * プロダクションビルドでは tree-shaking で除去可能。
 */

/** 事前条件チェック */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[Contract] ${message}`);
  }
}

/** 数値範囲チェック */
export function assertRange(
  value: number,
  min: number,
  max: number,
  name: string,
): void {
  assert(
    value >= min && value <= max,
    `${name} は ${min}〜${max} の範囲内であること（実際: ${value}）`,
  );
}

/** 整数チェック */
export function assertInteger(value: number, name: string): void {
  assert(
    Number.isInteger(value),
    `${name} は整数であること（実際: ${value}）`,
  );
}

/** 非 null/undefined チェック */
export function assertDefined<T>(
  value: T | undefined | null,
  name: string,
): asserts value is T {
  assert(value != null, `${name} は定義されていること`);
}
