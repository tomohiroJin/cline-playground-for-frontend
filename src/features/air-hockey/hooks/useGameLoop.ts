/**
 * 後方互換アダプタ
 * 旧 22 パラメータインターフェースから新しいグループ化インターフェースへ変換する。
 * 新規コードは presentation/hooks/useGameLoop を直接使用すること。
 */
import React from 'react';
import {
  useGameLoop as useGameLoopPresentation,
  type GameLoopConfig,
  type GameLoopRefs,
  type GameLoopCallbacks,
} from '../presentation/hooks/useGameLoop';
import type {
  Difficulty,
  FieldConfig,
  SoundSystem,
  GameState,
  GamePhase,
  ShakeState,
  MatchStats,
} from '../core/types';
import type { KeyboardState } from '../core/keyboard';

// 新インターフェースの型を re-export
export type { GameLoopConfig, GameLoopRefs, GameLoopCallbacks };

/**
 * ゲームループフック（後方互換）
 * 22 個の個別パラメータを受け取り、内部で 5 グループに変換して委譲する。
 */
export function useGameLoop(
  screen: string,
  diff: Difficulty,
  field: FieldConfig,
  winScore: number,
  showHelp: boolean,
  getSound: () => SoundSystem,
  gameRef: React.RefObject<GameState | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  lastInputRef: React.MutableRefObject<number>,
  scoreRef: React.MutableRefObject<{ p: number; c: number }>,
  setScores: (s: { p: number; c: number }) => void,
  setWinner: (w: string | null) => void,
  setScreen: (s: 'menu' | 'game' | 'result') => void,
  setShowHelp: (v: boolean) => void,
  phaseRef: React.MutableRefObject<GamePhase>,
  countdownStartRef: React.MutableRefObject<number>,
  shakeRef: React.MutableRefObject<ShakeState | null>,
  setShake: (s: ShakeState | null) => void,
  bgmEnabled: boolean,
  statsRef: React.MutableRefObject<MatchStats>,
  matchStartRef: React.MutableRefObject<number>,
  keysRef?: React.MutableRefObject<KeyboardState>
): void {
  useGameLoopPresentation({
    screen,
    showHelp,
    config: {
      difficulty: diff,
      field,
      winScore,
      getSound,
      bgmEnabled,
    },
    refs: {
      gameRef,
      canvasRef,
      lastInputRef,
      scoreRef,
      phaseRef,
      countdownStartRef,
      shakeRef,
      statsRef,
      matchStartRef,
      keysRef,
    },
    callbacks: {
      setScores,
      setWinner,
      setScreen,
      setShowHelp,
      setShake,
    },
  });
}
