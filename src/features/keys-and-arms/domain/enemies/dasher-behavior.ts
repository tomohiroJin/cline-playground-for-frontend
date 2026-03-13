/**
 * DASHER AI（純粋関数）
 *
 * 草原ステージのスケルトン型敵。
 * step 2 で充電し、一気に step 0 まで突進する。
 */
import type { PrairieEnemy } from '../../types/stage';

/** DASHER 敵を生成 */
export function createDasherEnemy(lane: number): Pick<PrairieEnemy, 'beh' | 'lane' | 'step' | 'shiftDir' | 'shifted' | 'dashReady'> {
  return {
    beh: 'dasher',
    lane,
    step: 3,
    shiftDir: 0,
    shifted: false,
    dashReady: false,
  };
}

/** DASHER が充電を開始するべきか判定 */
export function shouldDasherCharge(step: number): boolean {
  return step === 2;
}

/** DASHER が充電中か判定 */
export function isDasherCharging(dashReady: boolean): boolean {
  return dashReady;
}
