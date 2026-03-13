/**
 * BAT AI（純粋関数）
 *
 * 洞窟ステージ pos 4 のコウモリ。
 * ビートサイクルに基づいて 3 フェーズで動作する。
 */
import { calculateHazardPhase, isDangerPhase } from './hazard-phase';

/** BAT のフェーズ閾値 */
const BAT_PHASE1_RATIO = 0.4;
const BAT_PHASE2_RATIO = 0.7;

/** BAT 状態 */
export interface BatState {
  readonly phase: number;
  readonly beat: number;
}

/** BAT の初期状態を生成 */
export function createBatState(): BatState {
  return { phase: 0, beat: 0 };
}

/**
 * ビートカウントに基づいて BAT のフェーズを算出（純粋関数）
 * @returns 0=静止, 1=中間, 2=接近（危険）
 */
export function updateBatPhase(beatCount: number, hazardPeriod: number): number {
  return calculateHazardPhase(beatCount, hazardPeriod, BAT_PHASE1_RATIO, BAT_PHASE2_RATIO);
}

/** BAT が危険状態か判定 */
export function isBatDangerous(phase: number): boolean {
  return isDangerPhase(phase);
}
