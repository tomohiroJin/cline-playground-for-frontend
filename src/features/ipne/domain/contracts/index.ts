/**
 * 契約チェックユーティリティ
 *
 * DbC（Design by Contract）に基づくアサーション関数群。
 * 事前条件（require）、事後条件（ensure）、不変条件（invariant）と
 * ドメイン固有のバリデーション関数を提供する。
 */

// ===== DbC 基本アサーション =====

/**
 * 事前条件（Precondition）を検証する
 *
 * 関数の呼び出し前に満たすべき条件を検証する。
 * 条件が偽の場合、エラーを投げる。
 */
export function require(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`事前条件違反: ${message}`);
  }
}

/**
 * 事後条件（Postcondition）を検証する
 *
 * 関数の実行後に満たすべき条件を検証する。
 * 条件が偽の場合、エラーを投げる。
 */
export function ensure(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`事後条件違反: ${message}`);
  }
}

/**
 * 不変条件（Invariant）を検証する
 *
 * エンティティやシステムが常に満たすべき条件を検証する。
 * 条件が偽の場合、エラーを投げる。
 */
export function invariant(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`不変条件違反: ${message}`);
  }
}

// ===== 後方互換エイリアス =====

/**
 * 汎用アサーション（require のエイリアス）
 *
 * 既存コードとの後方互換のため維持。新規コードでは require/ensure/invariant を使用すること。
 */
export function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ===== ドメイン固有バリデーション =====

export function assertNumberInRange(
  value: number,
  min: number,
  max: number,
  name: string
): void {
  assertCondition(Number.isFinite(value), `${name} は有限数である必要があります`);
  assertCondition(value >= min && value <= max, `${name} は ${min} 以上 ${max} 以下である必要があります`);
}

export function assertIntegerInRange(
  value: number,
  min: number,
  max: number,
  name: string
): void {
  assertCondition(Number.isInteger(value), `${name} は整数である必要があります`);
  assertCondition(value >= min && value <= max, `${name} は ${min} 以上 ${max} 以下である必要があります`);
}

export function assertUniquePositions(
  positions: Array<{ x: number; y: number }>,
  name: string
): void {
  const seen = new Set<string>();
  for (const position of positions) {
    const key = `${position.x},${position.y}`;
    assertCondition(!seen.has(key), `${name} に重複座標が含まれています: ${key}`);
    seen.add(key);
  }
}
