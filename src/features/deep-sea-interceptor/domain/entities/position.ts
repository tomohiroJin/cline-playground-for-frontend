// ============================================================================
// Deep Sea Interceptor - Position 値オブジェクト（不変）
// ============================================================================

import type { Position } from '../../types';

/** 有限数値チェック（DbC 事前条件） */
function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} は有限数値でなければなりません: ${value}`);
  }
}

/** Position ファクトリ関数（事前条件チェック付き） */
export function createPosition(x: number, y: number): Position {
  assertFiniteNumber(x, 'x');
  assertFiniteNumber(y, 'y');
  return { x, y };
}

/** 2つの Position を加算 */
export function addPosition(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** Position を指定範囲にクランプ */
export function clampPosition(
  pos: Position,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): Position {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y)),
  };
}

/** 2つの Position 間の距離 */
export function distanceBetween(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
