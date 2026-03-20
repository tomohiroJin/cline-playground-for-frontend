// Race ドメイン型定義

export type GamePhase = 'menu' | 'countdown' | 'race' | 'draft' | 'result';
export type GameMode = 'solo' | '2p' | 'cpu';

export interface RaceConfig {
  readonly mode: GameMode;
  readonly courseIndex: number;
  readonly maxLaps: number;
  readonly baseSpeed: number;
  readonly cpuDifficulty: string;
  readonly cardsEnabled: boolean;
}

export interface GameResults {
  winnerName: string;
  winnerColor: string;
  times: { p1: number; p2: number };
  fastest: number;
}
