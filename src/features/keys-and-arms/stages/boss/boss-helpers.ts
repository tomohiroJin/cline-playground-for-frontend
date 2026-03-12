/**
 * ボスステージ共通ヘルパー
 */

import { SAFE_X, SAFE_Y, PED_POS } from '../../constants';

/** プレイヤー座標を台座位置またはセーフゾーンから取得 */
export function playerXY(pos: number): { x: number; y: number } {
  if (pos === 0) return { x: SAFE_X, y: SAFE_Y };
  return { x: PED_POS[pos - 1].x, y: PED_POS[pos - 1].y };
}
