// ハイライトトラッカー（純粋関数・副作用なし）

import type { HighlightType, HighlightEvent } from './types';

/** ハイライトトラッカーの型（旧コードとの互換性を維持） */
export interface HighlightTrackerState {
  events: HighlightEvent[];
  nearMissTime: number;
  lastPositions: number[];
  fastestLapTime: number;
  lastHeatGauge: number[];
  lastDriftActive: boolean[];
  /** 前フレームのドリフト継続時間（endDrift で duration が 0 にリセットされるため保持） */
  lastDriftDuration: number[];
}

/** トラッカーの初期化 */
export const createTracker = (playerCount: number = 2): HighlightTrackerState => ({
  events: [],
  nearMissTime: 0,
  lastPositions: new Array(playerCount).fill(0),
  fastestLapTime: Infinity,
  lastHeatGauge: new Array(playerCount).fill(0),
  lastDriftActive: new Array(playerCount).fill(false),
  lastDriftDuration: new Array(playerCount).fill(0),
});

/** サマリーの生成 */
export const getSummary = (
  tracker: HighlightTrackerState,
): { type: HighlightType; count: number; totalScore: number }[] => {
  const map = new Map<HighlightType, { count: number; totalScore: number }>();

  for (const event of tracker.events) {
    const entry = map.get(event.type) ?? { count: 0, totalScore: 0 };
    entry.count++;
    entry.totalScore += event.score;
    map.set(event.type, entry);
  }

  return Array.from(map.entries()).map(([type, data]) => ({ type, ...data }));
};
