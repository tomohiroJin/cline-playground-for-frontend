import type { SegState } from './useGameEngine';
import { LANES, ROWS } from '../constants';

/**
 * セグメント表示状態の初期配列を生成する
 *
 * 避難所レーンは 'shield'、それ以外は null で埋める。
 * initRender / clearSegs / nextCycle の重複初期化を共通化。
 */
export function createSegments(
  shelterLanes: readonly number[],
): (SegState | null)[][] {
  return LANES.map((l) =>
    Array(ROWS).fill(shelterLanes.includes(l) ? 'shield' : null),
  );
}

/**
 * セグメントテキストの初期配列を生成する
 *
 * 避難所レーンは '─'、それ以外は '╳' で埋める。
 */
export function createSegTexts(
  shelterLanes: readonly number[],
): string[][] {
  return LANES.map((l) =>
    Array(ROWS).fill(shelterLanes.includes(l) ? '─' : '╳'),
  );
}
