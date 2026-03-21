// Race ドメイン型定義

import type { CpuDifficulty } from '../player/cpu-strategy';

export type GamePhase = 'menu' | 'countdown' | 'race' | 'draft' | 'result';
export type GameMode = 'solo' | '2p' | 'cpu';

export interface RaceConfig {
  readonly mode: GameMode;
  readonly courseIndex: number;
  readonly maxLaps: number;
  readonly baseSpeed: number;
  readonly cpuDifficulty: CpuDifficulty;
  readonly cardsEnabled: boolean;
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
