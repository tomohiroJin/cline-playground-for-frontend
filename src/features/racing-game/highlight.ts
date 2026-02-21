// ハイライト検出モジュール

import type { DriftState, HeatState, HighlightEvent, HighlightType } from './types';
import { HIGHLIGHT } from './constants';

// === T-110: ハイライト検出モジュール ===

/** ハイライトトラッカーの型 */
export interface HighlightTracker {
  events: HighlightEvent[];
  nearMissTime: number;       // ニアミス継続時間（秒）
  lastPositions: number[];    // 前フレームの各プレイヤー progress
  fastestLapTime: number;     // そのレース中の最速ラップ（ms）
  lastHeatGauge: number[];    // 前フレームの HEAT ゲージ値
  lastDriftActive: boolean[]; // 前フレームのドリフト状態
}

/** check* 関数群の共通戻り型 */
type CheckResult = { tracker: HighlightTracker; event: HighlightEvent | null };

// === 内部ヘルパー（DRY） ===

/** イベント生成ヘルパー */
const createEvent = (
  type: HighlightType,
  player: number,
  lap: number,
  time: number,
  score: number,
  message: string
): HighlightEvent => ({ type, player, lap, time, score, message });

/** イベント付きトラッカー更新ヘルパー */
const withEvent = (
  tracker: HighlightTracker,
  event: HighlightEvent,
  patch?: Partial<HighlightTracker>
): CheckResult => ({
  tracker: { ...tracker, ...patch, events: [...tracker.events, event] },
  event,
});

/** イベントなしトラッカー更新ヘルパー */
const noEvent = (
  tracker: HighlightTracker,
  patch?: Partial<HighlightTracker>
): CheckResult => ({
  tracker: patch ? { ...tracker, ...patch } : tracker,
  event: null,
});

// === エクスポート関数 ===

/** トラッカーインスタンス生成 */
export const createHighlightTracker = (playerCount: number = 2): HighlightTracker => ({
  events: [],
  nearMissTime: 0,
  lastPositions: new Array(playerCount).fill(0),
  fastestLapTime: Infinity,
  lastHeatGauge: new Array(playerCount).fill(0),
  lastDriftActive: new Array(playerCount).fill(false),
});

/** ドリフトボーナス検出 */
export const checkDriftBonus = (
  tracker: HighlightTracker,
  driftState: DriftState,
  playerIndex: number,
  lap: number,
  time: number
): CheckResult => {
  const wasActive = tracker.lastDriftActive[playerIndex];
  const newLastDrift = [...tracker.lastDriftActive];
  newLastDrift[playerIndex] = driftState.active;
  const patch = { lastDriftActive: newLastDrift };

  if (wasActive && !driftState.active && driftState.duration >= HIGHLIGHT.DRIFT_MIN_DURATION) {
    const score = Math.floor(driftState.duration * HIGHLIGHT.DRIFT_SCORE_PER_SEC);
    return withEvent(
      tracker,
      createEvent('drift_bonus', playerIndex, lap, time, score, `ドリフトボーナス! +${score}pt`),
      patch
    );
  }
  return noEvent(tracker, patch);
};

/** HEAT ブースト発動時の検出 */
export const checkHeatBoost = (
  tracker: HighlightTracker,
  heatState: HeatState,
  playerIndex: number,
  lap: number,
  time: number
): CheckResult => {
  const prevGauge = tracker.lastHeatGauge[playerIndex];
  const newLastHeat = [...tracker.lastHeatGauge];
  newLastHeat[playerIndex] = heatState.gauge;
  const patch = { lastHeatGauge: newLastHeat };

  if (prevGauge >= HIGHLIGHT.HEAT_PREV_THRESHOLD && heatState.gauge < HIGHLIGHT.HEAT_CURR_THRESHOLD && heatState.boostRemaining > 0) {
    return withEvent(
      tracker,
      createEvent('heat_boost', playerIndex, lap, time, HIGHLIGHT.HEAT_SCORE, `HEAT BOOST! +${HIGHLIGHT.HEAT_SCORE}pt`),
      patch
    );
  }
  return noEvent(tracker, patch);
};

/** ニアミス回避検出 */
export const checkNearMiss = (
  tracker: HighlightTracker,
  wallDist: number,
  trackWidth: number,
  dt: number,
  playerIndex: number,
  lap: number,
  time: number
): CheckResult => {
  const nearWall = wallDist > trackWidth - HIGHLIGHT.NEAR_MISS_WALL_MARGIN;

  if (nearWall) {
    return noEvent(tracker, { nearMissTime: tracker.nearMissTime + dt });
  }

  if (tracker.nearMissTime >= HIGHLIGHT.NEAR_MISS_MIN_DURATION) {
    const score = Math.floor(tracker.nearMissTime * HIGHLIGHT.NEAR_MISS_SCORE_PER_SEC);
    return withEvent(
      tracker,
      createEvent('near_miss', playerIndex, lap, time, score, `ニアミス回避! +${score}pt`),
      { nearMissTime: 0 }
    );
  }

  return noEvent(tracker, { nearMissTime: 0 });
};

/** 順位逆転検出 */
export const checkOvertake = (
  tracker: HighlightTracker,
  positions: number[],
  playerIndex: number,
  lap: number,
  time: number
): CheckResult => {
  const prevPos = tracker.lastPositions;
  const patch = { lastPositions: [...positions] };

  if (positions.length < 2 || prevPos.length < 2) {
    return noEvent(tracker, patch);
  }

  const wasAhead = prevPos[playerIndex] > prevPos[1 - playerIndex];
  const isAhead = positions[playerIndex] > positions[1 - playerIndex];

  if (!wasAhead && isAhead) {
    return withEvent(
      tracker,
      createEvent('overtake', playerIndex, lap, time, HIGHLIGHT.OVERTAKE_SCORE, `逆転! +${HIGHLIGHT.OVERTAKE_SCORE}pt`),
      patch
    );
  }
  return noEvent(tracker, patch);
};

/** ファステストラップ検出 */
export const checkFastestLap = (
  tracker: HighlightTracker,
  lapTime: number,
  playerIndex: number,
  lap: number,
  time: number
): CheckResult => {
  if (lapTime < tracker.fastestLapTime) {
    return withEvent(
      tracker,
      createEvent('fastest_lap', playerIndex, lap, time, HIGHLIGHT.FASTEST_LAP_SCORE, `ファステストラップ! +${HIGHLIGHT.FASTEST_LAP_SCORE}pt`),
      { fastestLapTime: lapTime }
    );
  }
  return noEvent(tracker);
};

/** フォトフィニッシュ検出（ゴール時） */
export const checkPhotoFinish = (
  tracker: HighlightTracker,
  finishTimes: number[],
  lap: number,
  time: number
): CheckResult => {
  if (finishTimes.length < 2) return noEvent(tracker);

  const diff = Math.abs(finishTimes[0] - finishTimes[1]);
  if (diff < HIGHLIGHT.PHOTO_FINISH_THRESHOLD) {
    const winner = finishTimes[0] < finishTimes[1] ? 0 : 1;
    return withEvent(
      tracker,
      createEvent('photo_finish', winner, lap, time, HIGHLIGHT.PHOTO_FINISH_SCORE, `フォトフィニッシュ! +${HIGHLIGHT.PHOTO_FINISH_SCORE}pt`)
    );
  }
  return noEvent(tracker);
};

/** ハイライトサマリー集計 */
export const getHighlightSummary = (
  tracker: HighlightTracker
): { type: HighlightType; count: number; totalScore: number }[] => {
  const map = new Map<HighlightType, { count: number; totalScore: number }>();

  for (const event of tracker.events) {
    const entry = map.get(event.type) || { count: 0, totalScore: 0 };
    entry.count++;
    entry.totalScore += event.score;
    map.set(event.type, entry);
  }

  return Array.from(map.entries()).map(([type, data]) => ({
    type,
    ...data,
  }));
};

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
