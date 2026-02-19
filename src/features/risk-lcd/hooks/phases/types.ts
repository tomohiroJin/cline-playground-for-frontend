import type { MutableRefObject } from 'react';
import type { GameState, ArtKey, EmoKey } from '../../types';
import type { RenderState } from '../useGameEngine';

// RNG（乱数）API インターフェース
export interface RngApi {
  int(n: number): number;
  pick<T>(a: readonly T[]): T;
  chance(p: number): boolean;
  shuffle<T>(a: readonly T[]): T[];
  /** wPick 用の 0〜1 乱数 */
  random(): number;
}

// フェーズフック共有コンテキスト
export interface PhaseContext {
  gRef: MutableRefObject<GameState | null>;
  rsRef: MutableRefObject<RenderState>;
  rng: MutableRefObject<RngApi>;
  addTimer: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimers: () => void;
  patch: (partial: Partial<RenderState>) => void;
  syncGame: () => void;
  updArt: () => void;
  setArtTemp: (state: ArtKey, ms: number) => void;
  showPop: (lane: number, text: string) => void;
  clearSegs: () => void;
  isRestricted: (lane: number) => boolean;
  isShelter: (lane: number) => boolean;
  laneMultiplier: (lane: number) => number;
  resolveArtKey: (lane: number) => ArtKey;
  resolveEmoKey: (g: GameState | null) => EmoKey;
}
