/**
 * スコアユーティリティ — 後方互換ラッパー
 *
 * 新ドメイン層に移動済みの関数を再エクスポートする。
 * Phase 6 のクリーンアップで削除予定。
 */
import {
  PuzzleScore,
  PuzzleRank,
  PuzzleRecord,
  UnlockCondition,
  ThemeId,
} from '../types/puzzle';
import {
  calculateScore as domainCalculateScore,
  determineRank as domainDetermineRank,
  SCORE_CONSTANTS,
} from '../domain/scoring/score-calculator';
import {
  isThemeUnlocked as domainIsThemeUnlocked,
} from '../domain/theme/theme-unlock-service';

// 再エクスポート
export { SCORE_CONSTANTS };
export { RANK_THRESHOLDS } from '../domain/scoring/score-calculator';

/**
 * ランクを判定する — ドメイン層に委譲
 */
export const determineRank = (score: number): PuzzleRank =>
  domainDetermineRank(score);

/**
 * スコアを計算する — ドメイン層に委譲（旧シグネチャを維持）
 */
export const calculateScore = (
  actualMoves: number,
  optimalMoves: number,
  elapsedSeconds: number,
  hintUsed: boolean,
  division: number
): PuzzleScore =>
  domainCalculateScore({ actualMoves, optimalMoves, elapsedSeconds, hintUsed, division });

/**
 * テーマがアンロック済みかを判定する — ドメイン層に委譲（旧シグネチャを維持）
 */
export const isThemeUnlocked = (
  condition: UnlockCondition,
  totalClears: number,
  records: PuzzleRecord[],
  themeImageIds?: Map<ThemeId, string[]>
): boolean =>
  domainIsThemeUnlocked(condition, {
    totalClears,
    records,
    themeImageIds: themeImageIds ?? new Map(),
  });
