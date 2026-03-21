// ハイライトイベント検出（純粋関数・副作用なし）

import type { DriftState, HeatState } from '../player/types';
import type { HighlightType, HighlightEvent } from './types';
import type { HighlightTrackerState } from './highlight';
import { HIGHLIGHT } from './constants';

/** check* 関数群の共通戻り型 */
export type DetectionResult = {
  tracker: HighlightTrackerState;
  event: HighlightEvent | null;
};

// === 内部ヘルパー ===

const createEvent = (
  type: HighlightType,
  player: number,
  lap: number,
  time: number,
  score: number,
  message: string,
): HighlightEvent => ({ type, player, lap, time, score, message });

const withEvent = (
  tracker: HighlightTrackerState,
  event: HighlightEvent,
  patch?: Partial<HighlightTrackerState>,
): DetectionResult => ({
  tracker: { ...tracker, ...patch, events: [...tracker.events, event] },
  event,
});

const noEvent = (
  tracker: HighlightTrackerState,
  patch?: Partial<HighlightTrackerState>,
): DetectionResult => ({
  tracker: patch ? { ...tracker, ...patch } : tracker,
  event: null,
});

// === エクスポート関数 ===

/** ドリフトボーナス検出
 * endDrift 後は duration が 0 にリセットされるため、
 * 前フレームの duration（lastDriftDuration）を使って判定する
 */
export const detectDriftBonus = (
  tracker: HighlightTrackerState,
  driftState: DriftState,
  playerIndex: number,
  lap: number,
  time: number,
): DetectionResult => {
  const wasActive = tracker.lastDriftActive[playerIndex];
  const prevDuration = tracker.lastDriftDuration[playerIndex];

  const newLastDrift = [...tracker.lastDriftActive];
  newLastDrift[playerIndex] = driftState.active;
  const newLastDuration = [...tracker.lastDriftDuration];
  newLastDuration[playerIndex] = driftState.duration;
  const patch = { lastDriftActive: newLastDrift, lastDriftDuration: newLastDuration };

  // endDrift 後は duration=0 になるため、前フレームの duration を使用
  const effectiveDuration = driftState.active ? driftState.duration : prevDuration;

  if (wasActive && !driftState.active && effectiveDuration >= HIGHLIGHT.DRIFT_MIN_DURATION) {
    const score = Math.floor(effectiveDuration * HIGHLIGHT.DRIFT_SCORE_PER_SEC);
    return withEvent(
      tracker,
      createEvent('drift_bonus', playerIndex, lap, time, score, `ドリフトボーナス! +${score}pt`),
      patch,
    );
  }
  return noEvent(tracker, patch);
};

/** HEAT ブースト発動時の検出 */
export const detectHeatBoost = (
  tracker: HighlightTrackerState,
  heatState: HeatState,
  playerIndex: number,
  lap: number,
  time: number,
): DetectionResult => {
  const prevGauge = tracker.lastHeatGauge[playerIndex];
  const newLastHeat = [...tracker.lastHeatGauge];
  newLastHeat[playerIndex] = heatState.gauge;
  const patch = { lastHeatGauge: newLastHeat };

  if (prevGauge >= HIGHLIGHT.HEAT_PREV_THRESHOLD && heatState.gauge < HIGHLIGHT.HEAT_CURR_THRESHOLD && heatState.boostRemaining > 0) {
    return withEvent(
      tracker,
      createEvent('heat_boost', playerIndex, lap, time, HIGHLIGHT.HEAT_SCORE, `HEAT BOOST! +${HIGHLIGHT.HEAT_SCORE}pt`),
      patch,
    );
  }
  return noEvent(tracker, patch);
};

/** ニアミス回避検出 */
export const detectNearMiss = (
  tracker: HighlightTrackerState,
  wallDist: number,
  trackWidth: number,
  dt: number,
  playerIndex: number,
  lap: number,
  time: number,
): DetectionResult => {
  const nearWall = wallDist > trackWidth - HIGHLIGHT.NEAR_MISS_WALL_MARGIN;

  if (nearWall) {
    return noEvent(tracker, { nearMissTime: tracker.nearMissTime + dt });
  }

  if (tracker.nearMissTime >= HIGHLIGHT.NEAR_MISS_MIN_DURATION) {
    const score = Math.floor(tracker.nearMissTime * HIGHLIGHT.NEAR_MISS_SCORE_PER_SEC);
    return withEvent(
      tracker,
      createEvent('near_miss', playerIndex, lap, time, score, `ニアミス回避! +${score}pt`),
      { nearMissTime: 0 },
    );
  }

  return noEvent(tracker, { nearMissTime: 0 });
};

/** 順位逆転検出 */
export const detectOvertake = (
  tracker: HighlightTrackerState,
  positions: number[],
  playerIndex: number,
  lap: number,
  time: number,
): DetectionResult => {
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
      patch,
    );
  }
  return noEvent(tracker, patch);
};

/** ファステストラップ検出 */
export const detectFastestLap = (
  tracker: HighlightTrackerState,
  lapTime: number,
  playerIndex: number,
  lap: number,
  time: number,
): DetectionResult => {
  if (lapTime < tracker.fastestLapTime) {
    return withEvent(
      tracker,
      createEvent('fastest_lap', playerIndex, lap, time, HIGHLIGHT.FASTEST_LAP_SCORE, `ファステストラップ! +${HIGHLIGHT.FASTEST_LAP_SCORE}pt`),
      { fastestLapTime: lapTime },
    );
  }
  return noEvent(tracker);
};

/** フォトフィニッシュ検出 */
export const detectPhotoFinish = (
  tracker: HighlightTrackerState,
  finishTimes: number[],
  lap: number,
  time: number,
): DetectionResult => {
  if (finishTimes.length < 2) return noEvent(tracker);

  const diff = Math.abs(finishTimes[0] - finishTimes[1]);
  if (diff < HIGHLIGHT.PHOTO_FINISH_THRESHOLD) {
    const winner = finishTimes[0] < finishTimes[1] ? 0 : 1;
    return withEvent(
      tracker,
      createEvent('photo_finish', winner, lap, time, HIGHLIGHT.PHOTO_FINISH_SCORE, `フォトフィニッシュ! +${HIGHLIGHT.PHOTO_FINISH_SCORE}pt`),
    );
  }
  return noEvent(tracker);
};
