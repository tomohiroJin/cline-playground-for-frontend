/**
 * SHIFTER AI（純粋関数）
 *
 * 草原ステージのゴブリン型敵。
 * step 2 でレーン移動する。
 */
import type { PrairieEnemy } from '../../types/stage';

/** SHIFTER 敵を生成 */
export function createShifterEnemy(lane: number): Pick<PrairieEnemy, 'beh' | 'lane' | 'step' | 'shiftDir' | 'shifted' | 'dashReady'> {
  return {
    beh: 'shifter',
    lane,
    step: 3,
    shiftDir: Math.random() < 0.5 ? -1 : 1,
    shifted: false,
    dashReady: false,
  };
}

/** SHIFTER がレーン移動するべきか判定 */
export function shouldShifterMove(step: number): boolean {
  return step === 2;
}

/**
 * レーン移動の計算
 * @param currentLane 現在のレーン
 * @param direction 移動方向（-1=上, 0=なし, 1=下）
 * @param maxLanes レーン数
 * @returns 新しいレーン番号
 */
export function shiftLane(currentLane: number, direction: number, maxLanes: number): number {
  const next = currentLane + direction;
  if (next < 0) return 0;
  if (next >= maxLanes) return maxLanes - 1;
  return next;
}
