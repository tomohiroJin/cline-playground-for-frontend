/**
 * ダメージ・スコア計算（純粋関数）
 *
 * キル、スウィープ、設置等のスコア計算を一元管理する。
 */
import { assert } from '../contracts/assertions';

/** 通常キルスコア: (100 + combo * 40) * loop */
export function calculateKillScore(combo: number, loop: number): number {
  assert(combo >= 0, 'コンボ数は 0 以上');
  assert(loop >= 1, 'ループは 1 以上');
  return (100 + combo * 40) * loop;
}

/** スウィープスコア: (200 + combo * 60) * loop */
export function calculateSweepScore(combo: number, loop: number): number {
  assert(combo >= 0, 'コンボ数は 0 以上');
  assert(loop >= 1, 'ループは 1 以上');
  return (200 + combo * 60) * loop;
}

/** 鍵収集スコア: 300 * loop */
export function calculateKeyCollectScore(loop: number): number {
  assert(loop >= 1, 'ループは 1 以上');
  return 300 * loop;
}

/** 鍵/宝石設置スコア: 500 * loop */
export function calculatePlaceScore(loop: number): number {
  assert(loop >= 1, 'ループは 1 以上');
  return 500 * loop;
}

/** カウンタースコア: 300 * loop */
export function calculateCounterScore(loop: number): number {
  assert(loop >= 1, 'ループは 1 以上');
  return 300 * loop;
}

/** シールド設置スコア: 200 * loop */
export function calculateShieldScore(loop: number): number {
  assert(loop >= 1, 'ループは 1 以上');
  return 200 * loop;
}

/** ガードキルスコア: 50 * loop */
export function calculateGuardScore(loop: number): number {
  assert(loop >= 1, 'ループは 1 以上');
  return 50 * loop;
}

/** ステージ種別 */
export type StageType = 'cave' | 'prairie';

/** ステージクリアスコア */
const STAGE_CLEAR_MULTIPLIER: Record<StageType, number> = {
  cave: 2000,
  prairie: 3000,
};

/** ステージクリアスコア */
export function calculateStageClearScore(stage: StageType, loop: number): number {
  assert(loop >= 1, 'ループは 1 以上');
  return STAGE_CLEAR_MULTIPLIER[stage] * loop;
}

/** ボスクリアスコア: 5000 * loop */
export function calculateBossClearScore(loop: number): number {
  assert(loop >= 1, 'ループは 1 以上');
  return 5000 * loop;
}
