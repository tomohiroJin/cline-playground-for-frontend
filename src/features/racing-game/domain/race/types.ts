// Race ドメイン型定義

import type { CpuDifficulty } from '../player/cpu-strategy';
import type { Stage } from './stage';

export type GamePhase =
  | 'menu'
  | 'countdown'
  | 'race'
  | 'draft'
  | 'result'
  // 以下、キャンペーン用に追加（spec §1.2）
  | 'stage_select'
  | 'stage_clear'
  | 'game_over'
  | 'ending';

export type GameMode = 'solo' | '2p' | 'cpu';

export interface RaceConfig {
  readonly mode: GameMode;
  readonly courseIndex: number;
  readonly maxLaps: number;
  readonly baseSpeed: number;
  readonly cpuDifficulty: CpuDifficulty;
  readonly cardsEnabled: boolean;
  /**
   * キャンペーンモード時のみ定義される。
   * 定義されているとキャンペーンとして処理する（pre-implementation-notes §設計上の決定）。
   */
  readonly campaignStage?: Stage;
}

export interface RaceState {
  readonly phase: GamePhase;
  readonly raceStartTime: number;
  readonly winner: string | null;
  readonly paused: boolean;
}

export interface GameResults {
  winnerName: string;
  winnerColor: string;
  times: { p1: number; p2: number };
  fastest: number;
}
