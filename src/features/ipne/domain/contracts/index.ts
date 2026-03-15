/**
 * 契約チェックユーティリティ
 */

export function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

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
