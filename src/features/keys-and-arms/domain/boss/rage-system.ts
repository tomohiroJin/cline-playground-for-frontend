/**
 * レイジウェーブシステム（純粋関数）
 *
 * ボスの怒りレベルに基づいたレイジウェーブの発動を管理する。
 */

/** レイジ発動に必要な最低怒りレベル */
const RAGE_THRESHOLD = 3;

/** 強レイジの怒りレベル閾値 */
const STRONG_RAGE_THRESHOLD = 5;

/** 怒りレベルを算出（設置済み宝石数） */
export function calculateAngerLevel(peds: number[]): number {
  return peds.filter(p => p > 0).length;
}

/** レイジウェーブが発動可能か */
export function canTriggerRage(angerLevel: number): boolean {
  return angerLevel >= RAGE_THRESHOLD;
}

/** レイジウェーブで起動する腕の数 */
export function getRageWakeCount(angerLevel: number): number {
  return angerLevel >= STRONG_RAGE_THRESHOLD ? 3 : 2;
}
