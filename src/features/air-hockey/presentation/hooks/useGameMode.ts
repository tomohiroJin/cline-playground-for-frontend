import { useState, useCallback } from 'react';
import type { Character, Difficulty, FieldConfig, GameMode } from '../../core/types';
import type { StageDefinition, StoryProgress } from '../../core/story';
import type { DailyChallenge } from '../../core/daily-challenge';
import { FIELDS, DEFAULT_WIN_SCORE } from '../../core/config';

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
  selectedCpuCharacter: Character | undefined;
  setSelectedCpuCharacter: (c: Character | undefined) => void;
  player1Character: Character | undefined;
  setPlayer1Character: (c: Character | undefined) => void;
  player2Character: Character | undefined;
  setPlayer2Character: (c: Character | undefined) => void;
  allyCharacter: Character | undefined;
  setAllyCharacter: (c: Character | undefined) => void;
  enemyCharacter1: Character | undefined;
  setEnemyCharacter1: (c: Character | undefined) => void;
  enemyCharacter2: Character | undefined;
  setEnemyCharacter2: (c: Character | undefined) => void;
  pairMatchDifficulty: Difficulty;
  setPairMatchDifficulty: (d: Difficulty) => void;
  resetToFree: () => void;
};

/**
 * ゲームモード管理フック
 * - フリー対戦/ストーリーモード/デイリーチャレンジ/2P 対戦の切り替え
 * - 各モードの設定管理
 */
export function useGameMode(): UseGameModeReturn {
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [field, setField] = useState<FieldConfig>(FIELDS[0]);
  const [winScore, setWinScoreRaw] = useState(DEFAULT_WIN_SCORE);
  const [currentStage, setCurrentStage] = useState<StageDefinition | undefined>(undefined);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | undefined>(undefined);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>({ clearedStages: [] });
  const [selectedCpuCharacter, setSelectedCpuCharacter] = useState<Character | undefined>(undefined);
  const [player1Character, setPlayer1Character] = useState<Character | undefined>(undefined);
  const [player2Character, setPlayer2Character] = useState<Character | undefined>(undefined);
  const [allyCharacter, setAllyCharacter] = useState<Character | undefined>(undefined);
  const [enemyCharacter1, setEnemyCharacter1] = useState<Character | undefined>(undefined);
  const [enemyCharacter2, setEnemyCharacter2] = useState<Character | undefined>(undefined);
  const [pairMatchDifficulty, setPairMatchDifficulty] = useState<Difficulty>('normal');

  /** 勝利スコアをバリデーション付きで設定 */
  const setWinScore = useCallback((s: number) => {
    const clamped = Math.max(MIN_WIN_SCORE, Math.min(MAX_WIN_SCORE, Math.floor(s)));
    setWinScoreRaw(clamped);
  }, []);

  /** フリーモードにリセット */
  const resetToFree = useCallback(() => {
    setGameMode('free');
    setIsDailyMode(false);
    setWinScoreRaw(DEFAULT_WIN_SCORE);
    setSelectedCpuCharacter(undefined);
    setPlayer1Character(undefined);
    setPlayer2Character(undefined);
    setAllyCharacter(undefined);
    setEnemyCharacter1(undefined);
    setEnemyCharacter2(undefined);
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
    selectedCpuCharacter,
    setSelectedCpuCharacter,
    currentStage,
    setCurrentStage,
    isDailyMode,
    setIsDailyMode,
    dailyChallenge,
    setDailyChallenge,
    storyProgress,
    setStoryProgress,
    player1Character,
    setPlayer1Character,
    player2Character,
    setPlayer2Character,
    allyCharacter,
    setAllyCharacter,
    enemyCharacter1,
    setEnemyCharacter1,
    enemyCharacter2,
    setEnemyCharacter2,
    pairMatchDifficulty,
    setPairMatchDifficulty,
    resetToFree,
  };
}
