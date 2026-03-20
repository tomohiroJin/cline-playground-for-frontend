import { useState, useCallback } from 'react';
import type { Difficulty, FieldConfig, GameMode } from '../../core/types';
import type { StageDefinition, StoryProgress } from '../../core/story';
import type { DailyChallenge } from '../../core/daily-challenge';
import { FIELDS } from '../../core/config';

/** 勝利スコアの最小値 */
const MIN_WIN_SCORE = 1;
/** 勝利スコアの最大値 */
const MAX_WIN_SCORE = 10;

/** ゲームモード管理フックの返り値 */
export type UseGameModeReturn = {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  field: FieldConfig;
  setField: (f: FieldConfig) => void;
  winScore: number;
  setWinScore: (s: number) => void;
  currentStage: StageDefinition | undefined;
  setCurrentStage: (stage: StageDefinition | undefined) => void;
  isDailyMode: boolean;
  setIsDailyMode: (v: boolean) => void;
  dailyChallenge: DailyChallenge | undefined;
  setDailyChallenge: (c: DailyChallenge | undefined) => void;
  storyProgress: StoryProgress;
  setStoryProgress: (p: StoryProgress) => void;
  resetToFree: () => void;
};

/**
 * ゲームモード管理フック
 * - フリー対戦/ストーリーモード/デイリーチャレンジの切り替え
 * - 各モードの設定管理
 */
export function useGameMode(): UseGameModeReturn {
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [field, setField] = useState<FieldConfig>(FIELDS[0]);
  const [winScore, setWinScoreRaw] = useState(3);
  const [currentStage, setCurrentStage] = useState<StageDefinition | undefined>(undefined);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | undefined>(undefined);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>({ clearedStages: [] });

  /** 勝利スコアをバリデーション付きで設定 */
  const setWinScore = useCallback((s: number) => {
    const clamped = Math.max(MIN_WIN_SCORE, Math.min(MAX_WIN_SCORE, Math.floor(s)));
    setWinScoreRaw(clamped);
  }, []);

  /** フリーモードにリセット */
  const resetToFree = useCallback(() => {
    setGameMode('free');
    setIsDailyMode(false);
  }, []);

  return {
    gameMode,
    setGameMode,
    difficulty,
    setDifficulty,
    field,
    setField,
    winScore,
    setWinScore,
    currentStage,
    setCurrentStage,
    isDailyMode,
    setIsDailyMode,
    dailyChallenge,
    setDailyChallenge,
    storyProgress,
    setStoryProgress,
    resetToFree,
  };
}
