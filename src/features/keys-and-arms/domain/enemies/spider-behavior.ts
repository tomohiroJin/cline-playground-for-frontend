/**
 * SPIDER AI（純粋関数）
 *
 * 洞窟ステージ pos 10 のクモ。
 * ビートサイクルに基づいて 3 フェーズで動作する。
 */
import { calculateHazardPhase, isDangerPhase } from './hazard-phase';

/** SPIDER のフェーズ閾値 */
const SPIDER_PHASE1_RATIO = 0.35;
const SPIDER_PHASE2_RATIO = 0.6;

/**
 * ビートカウントに基づいて SPIDER のフェーズを算出（純粋関数）
 * @returns 0=上部（安全）, 1=下降中, 2=底部（危険）
 */
export function updateSpiderPhase(beatCount: number, hazardPeriod: number): number {
  return calculateHazardPhase(beatCount, hazardPeriod, SPIDER_PHASE1_RATIO, SPIDER_PHASE2_RATIO);
}

/** SPIDER が危険状態か判定 */
export function isSpiderDangerous(phase: number): boolean {
  return isDangerPhase(phase);
}
