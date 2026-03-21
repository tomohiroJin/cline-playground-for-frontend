// Highlight ドメイン型定義

export type HighlightType =
  | 'drift_bonus'
  | 'heat_boost'
  | 'near_miss'
  | 'overtake'
  | 'fastest_lap'
  | 'photo_finish';

export interface HighlightEvent {
  type: HighlightType;
  player: number;
  lap: number;
  time: number;
  score: number;
  message: string;
}

export interface PlayerHighlightState {
  wasDrifting: boolean;
  nearMissTime: number;
  lastPosition: number;
  wasHeatBoosting: boolean;
  fastestLapTime: number;
}

export interface HighlightTracker {
  events: HighlightEvent[];
  playerStates: PlayerHighlightState[];
}
