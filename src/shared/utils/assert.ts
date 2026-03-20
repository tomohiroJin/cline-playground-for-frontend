/**
 * DbC（契約による設計）アサーションユーティリティ
 * 事前条件・事後条件の検証に使用する
 */

/**
 * 条件が満たされない場合にエラーをスローする
 *
 * @param condition 検証する条件
 * @param message エラーメッセージ
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * 値がnullまたはundefinedでないことを保証する型ガード関数
 *
 * @param value 検証する値
 * @param message エラーメッセージ
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(`Assertion failed: ${message}`);
  }
}
