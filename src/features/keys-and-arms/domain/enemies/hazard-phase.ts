/**
 * ハザードフェーズ計算（共通ユーティリティ）
 *
 * BAT, SPIDER 等のビートサイクルベース敵で共有する。
 */
import { assert } from '../contracts/assertions';

/**
 * ビートカウントに基づいてフェーズを算出（純粋関数）
 * @param beatCount 現在のビートカウント（周期内）
 * @param hazardPeriod ハザードサイクル周期
 * @param phase1Ratio フェーズ 0→1 の閾値比率
 * @param phase2Ratio フェーズ 1→2 の閾値比率
 * @returns 0=安全, 1=中間, 2=危険
 */
export function calculateHazardPhase(
  beatCount: number,
  hazardPeriod: number,
  phase1Ratio: number,
  phase2Ratio: number,
): number {
  assert(hazardPeriod > 0, 'ハザード周期は 1 以上');
  assert(beatCount >= 0, 'ビートカウントは 0 以上');

  if (beatCount < Math.floor(hazardPeriod * phase1Ratio)) return 0;
  if (beatCount < Math.floor(hazardPeriod * phase2Ratio)) return 1;
  return 2;
}

/** フェーズ 2 が危険状態 */
export function isDangerPhase(phase: number): boolean {
  return phase === 2;
}
