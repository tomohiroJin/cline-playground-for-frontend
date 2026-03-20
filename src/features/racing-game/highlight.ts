// ハイライト検出モジュール
// 移行期間中: domain/highlight/ へ委譲

import type { HighlightType } from './types';
import {
  createTracker,
  getSummary,
} from './domain/highlight/highlight';
import type { HighlightTrackerState } from './domain/highlight/highlight';
import {
  detectDriftBonus,
  detectHeatBoost,
  detectNearMiss,
  detectOvertake,
  detectFastestLap,
  detectPhotoFinish,
} from './domain/highlight/event-detector';

// 旧型名の re-export（後方互換）
export type HighlightTracker = HighlightTrackerState;

export const createHighlightTracker = createTracker;
export const getHighlightSummary = getSummary;

// 旧名での re-export
export const checkDriftBonus = detectDriftBonus;
export const checkHeatBoost = detectHeatBoost;
export const checkNearMiss = detectNearMiss;
export const checkOvertake = detectOvertake;
export const checkFastestLap = detectFastestLap;
export const checkPhotoFinish = detectPhotoFinish;

/** ハイライトタイプの表示名 */
export const HIGHLIGHT_LABELS: Record<HighlightType, string> = {
  drift_bonus: 'ドリフトボーナス',
  heat_boost: 'HEAT ブースト',
  near_miss: 'ニアミス回避',
  overtake: '逆転',
  fastest_lap: 'ファステストラップ',
  photo_finish: 'フォトフィニッシュ',
};

/** ハイライトタイプの背景色 */
export const HIGHLIGHT_COLORS: Record<HighlightType, string> = {
  drift_bonus: '#FF8C00',
  heat_boost: '#FF2020',
  near_miss: '#FFD700',
  overtake: '#9B59B6',
  fastest_lap: '#2ECC71',
  photo_finish: '#FFFFFF',
};

export const Highlight = {
  createTracker: createHighlightTracker,
  checkDriftBonus,
  checkHeatBoost,
  checkNearMiss,
  checkOvertake,
  checkFastestLap,
  checkPhotoFinish,
  getSummary: getHighlightSummary,
  LABELS: HIGHLIGHT_LABELS,
  COLORS: HIGHLIGHT_COLORS,
};
