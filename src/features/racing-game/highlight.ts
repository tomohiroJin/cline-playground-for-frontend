// ハイライト検出モジュール

import type { DriftState, HeatState, HighlightEvent, HighlightType } from './types';

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

/** トラッカーインスタンス生成 */
export const createHighlightTracker = (playerCount: number = 2): HighlightTracker => ({
  events: [],
  nearMissTime: 0,
  lastPositions: new Array(playerCount).fill(0),
  fastestLapTime: Infinity,
  lastHeatGauge: new Array(playerCount).fill(0),
  lastDriftActive: new Array(playerCount).fill(false),
});

/** ドリフト 1.5秒以上でボーナス検出 */
export const checkDriftBonus = (
  tracker: HighlightTracker,
  driftState: DriftState,
  playerIndex: number,
  lap: number,
  time: number
): { tracker: HighlightTracker; event: HighlightEvent | null } => {
  const wasActive = tracker.lastDriftActive[playerIndex];
  const newLastDrift = [...tracker.lastDriftActive];
  newLastDrift[playerIndex] = driftState.active;

  // ドリフト終了時に判定
  if (wasActive && !driftState.active && driftState.duration >= 1.5) {
    const score = Math.floor(driftState.duration * 100);
    const event: HighlightEvent = {
      type: 'drift_bonus',
      player: playerIndex,
      lap,
      time,
      score,
      message: `ドリフトボーナス! +${score}pt`,
    };
    return {
      tracker: {
        ...tracker,
        events: [...tracker.events, event],
        lastDriftActive: newLastDrift,
      },
      event,
    };
  }

  return { tracker: { ...tracker, lastDriftActive: newLastDrift }, event: null };
};

/** HEAT ブースト発動時の検出 */
export const checkHeatBoost = (
  tracker: HighlightTracker,
  heatState: HeatState,
  playerIndex: number,
  lap: number,
  time: number
): { tracker: HighlightTracker; event: HighlightEvent | null } => {
  const prevGauge = tracker.lastHeatGauge[playerIndex];
  const newLastHeat = [...tracker.lastHeatGauge];
  newLastHeat[playerIndex] = heatState.gauge;

  // ゲージが1.0からリセットされた（ブースト発動）
  if (prevGauge >= 0.95 && heatState.gauge < 0.1 && heatState.boostRemaining > 0) {
    const event: HighlightEvent = {
      type: 'heat_boost',
      player: playerIndex,
      lap,
      time,
      score: 150,
      message: 'HEAT BOOST! +150pt',
    };
    return {
      tracker: {
        ...tracker,
        events: [...tracker.events, event],
        lastHeatGauge: newLastHeat,
      },
      event,
    };
  }

  return { tracker: { ...tracker, lastHeatGauge: newLastHeat }, event: null };
};

/** ニアミス回避: 壁距離 < 10px で0.5秒以上走行 */
export const checkNearMiss = (
  tracker: HighlightTracker,
  wallDist: number,
  trackWidth: number,
  dt: number,
  playerIndex: number,
  lap: number,
  time: number
): { tracker: HighlightTracker; event: HighlightEvent | null } => {
  const nearWall = wallDist > trackWidth - 10;

  if (nearWall) {
    const newTime = tracker.nearMissTime + dt;
    return {
      tracker: { ...tracker, nearMissTime: newTime },
      event: null,
    };
  }

  // 壁から離れた時に判定（閾値を引き上げて頻発を抑制）
  if (tracker.nearMissTime >= 1.5) {
    const score = Math.floor(tracker.nearMissTime * 200);
    const event: HighlightEvent = {
      type: 'near_miss',
      player: playerIndex,
      lap,
      time,
      score,
      message: `ニアミス回避! +${score}pt`,
    };
    return {
      tracker: {
        ...tracker,
        nearMissTime: 0,
        events: [...tracker.events, event],
      },
      event,
    };
  }

  return { tracker: { ...tracker, nearMissTime: 0 }, event: null };
};

/** 順位逆転検出 */
export const checkOvertake = (
  tracker: HighlightTracker,
  positions: number[],
  playerIndex: number,
  lap: number,
  time: number
): { tracker: HighlightTracker; event: HighlightEvent | null } => {
  const prevPos = tracker.lastPositions;
  const newTracker = { ...tracker, lastPositions: [...positions] };

  if (positions.length < 2 || prevPos.length < 2) {
    return { tracker: newTracker, event: null };
  }

  // プレイヤーの順位が逆転したか（progress が大きい方が先）
  const wasAhead = prevPos[playerIndex] > prevPos[1 - playerIndex];
  const isAhead = positions[playerIndex] > positions[1 - playerIndex];

  if (!wasAhead && isAhead) {
    const event: HighlightEvent = {
      type: 'overtake',
      player: playerIndex,
      lap,
      time,
      score: 300,
      message: '逆転! +300pt',
    };
    return {
      tracker: {
        ...newTracker,
        events: [...newTracker.events, event],
      },
      event,
    };
  }

  return { tracker: newTracker, event: null };
};

/** ファステストラップ検出 */
export const checkFastestLap = (
  tracker: HighlightTracker,
  lapTime: number,
  playerIndex: number,
  lap: number,
  time: number
): { tracker: HighlightTracker; event: HighlightEvent | null } => {
  if (lapTime < tracker.fastestLapTime) {
    const event: HighlightEvent = {
      type: 'fastest_lap',
      player: playerIndex,
      lap,
      time,
      score: 200,
      message: 'ファステストラップ! +200pt',
    };
    return {
      tracker: {
        ...tracker,
        fastestLapTime: lapTime,
        events: [...tracker.events, event],
      },
      event,
    };
  }
  return { tracker, event: null };
};

/** フォトフィニッシュ検出（ゴール時） */
export const checkPhotoFinish = (
  tracker: HighlightTracker,
  finishTimes: number[],
  lap: number,
  time: number
): { tracker: HighlightTracker; event: HighlightEvent | null } => {
  if (finishTimes.length < 2) return { tracker, event: null };

  const diff = Math.abs(finishTimes[0] - finishTimes[1]);
  if (diff < 500) {
    // タイム差 0.5秒未満
    const event: HighlightEvent = {
      type: 'photo_finish',
      player: finishTimes[0] < finishTimes[1] ? 0 : 1,
      lap,
      time,
      score: 500,
      message: 'フォトフィニッシュ! +500pt',
    };
    return {
      tracker: {
        ...tracker,
        events: [...tracker.events, event],
      },
      event,
    };
  }

  return { tracker, event: null };
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
