/**
 * リザルト画面の副作用処理フック
 *
 * 責務:
 * - スコア保存・ハイスコア読込
 * - 実績チェック・保存
 * - 難易度オートアジャスト
 * - アンロック更新
 * - デイリーチャレンジ結果保存
 * - ストーリーモードクリア処理
 */
import { useState, useEffect, useRef } from 'react';
import { saveScore, getHighScore } from '../../../../utils/score-storage';
import type { Difficulty, MatchStats } from '../../core/types';
import type { StoryProgress } from '../../core/story';
import { Achievement, checkAchievements, getUnlockedAchievements, saveUnlockedAchievements } from '../../core/achievements';
import { getStreakRecord, saveStreakRecord, recordMatchResult, getSuggestedDifficulty } from '../../core/difficulty-adjust';
import { getUnlockState, saveUnlockState, checkUnlocks, UnlockState } from '../../core/unlock';
import { loadStoryProgress, saveStoryProgress } from '../../core/story';
import { saveDailyChallengeResult } from '../../core/daily-challenge';
import { getDexEntryById } from '../../core/dex-data';
import type { UseCharacterDexReturn } from '../../hooks/useCharacterDex';
import type { UseGameModeReturn } from './useGameMode';

/** リザルト処理フックのパラメータ */
export type UseResultProcessingParams = {
  screen: string;
  winner: string | null;
  scoreRef: React.MutableRefObject<{ p: number; c: number }>;
  statsRef: React.MutableRefObject<MatchStats>;
  mode: UseGameModeReturn;
  dex: UseCharacterDexReturn;
};

/** リザルト処理フックの返り値 */
export type UseResultProcessingReturn = {
  highScore: number;
  matchStats: MatchStats | undefined;
  newAchievements: Achievement[];
  suggestedDifficulty: Difficulty | undefined;
  unlockState: UnlockState;
  newlyUnlockedCharacterName: string | undefined;
};

export function useResultProcessing({
  screen, winner, scoreRef, statsRef, mode, dex,
}: UseResultProcessingParams): UseResultProcessingReturn {
  const [highScore, setHighScore] = useState(0);
  const [matchStats, setMatchStats] = useState<MatchStats | undefined>(undefined);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<Difficulty | undefined>(undefined);
  const [unlockState, setUnlockState] = useState<UnlockState>(() => getUnlockState());
  const [newlyUnlockedCharacterName, setNewlyUnlockedCharacterName] = useState<string | undefined>(undefined);

  // 実績追跡用 ref
  const winStreakRef = useRef(0);
  const maxScoreDiffRef = useRef(0);
  const fieldsWonRef = useRef<string[]>([]);
  const itemTypesUsedRef = useRef<string[]>([]);

  // ハイスコア読み込み
  useEffect(() => {
    getHighScore('air_hockey', `${mode.difficulty}_${mode.winScore}`).then(setHighScore);
  }, [mode.difficulty, mode.winScore]);

  // リザルト画面表示時の副作用処理
  useEffect(() => {
    if (screen !== 'result') return;

    const margin = scoreRef.current.p - scoreRef.current.c;
    const key = `${mode.difficulty}_${mode.winScore}`;
    saveScore('air_hockey', margin, key).then(() =>
      getHighScore('air_hockey', key).then(setHighScore)
    );
    setMatchStats({ ...statsRef.current });

    const isWin = winner === 'player';
    if (isWin) {
      winStreakRef.current += 1;
      if (!fieldsWonRef.current.includes(mode.field.id)) {
        fieldsWonRef.current = [...fieldsWonRef.current, mode.field.id];
      }
    } else {
      winStreakRef.current = 0;
    }

    // 実績チェック
    const alreadyUnlocked = getUnlockedAchievements();
    const newlyUnlocked = checkAchievements({
      winner: winner ?? 'cpu',
      scores: scoreRef.current,
      difficulty: mode.difficulty,
      fieldId: mode.field.id,
      stats: statsRef.current,
      winStreak: winStreakRef.current,
      maxScoreDiff: maxScoreDiffRef.current,
      fieldsWon: fieldsWonRef.current,
      itemTypesUsed: itemTypesUsedRef.current,
    }, alreadyUnlocked);
    if (newlyUnlocked.length > 0) {
      setNewAchievements(newlyUnlocked);
      saveUnlockedAchievements([...alreadyUnlocked, ...newlyUnlocked.map(a => a.id)]);
    } else {
      setNewAchievements([]);
    }

    // 難易度オートアジャスト
    const prevStreak = getStreakRecord();
    const newStreak = recordMatchResult(prevStreak, isWin);
    saveStreakRecord(newStreak);
    setSuggestedDifficulty(getSuggestedDifficulty(newStreak, mode.difficulty));

    // アンロック更新
    const prevUnlock = getUnlockState();
    const newUnlock = checkUnlocks(prevUnlock, {
      isWin,
      difficulty: mode.difficulty,
      fieldId: mode.field.id,
    });
    saveUnlockState(newUnlock);
    setUnlockState(newUnlock);

    // デイリーチャレンジ結果保存
    if (mode.isDailyMode && mode.dailyChallenge) {
      saveDailyChallengeResult({
        date: mode.dailyChallenge.date,
        isCleared: isWin,
        playerScore: scoreRef.current.p,
        cpuScore: scoreRef.current.c,
      });
      mode.setIsDailyMode(false);
    }

    // ストーリーモード: クリア処理
    if (mode.gameMode === 'story' && mode.currentStage && isWin) {
      const current = loadStoryProgress();
      if (!current.clearedStages.includes(mode.currentStage.id)) {
        const updated: StoryProgress = {
          clearedStages: [...current.clearedStages, mode.currentStage.id],
        };
        saveStoryProgress(updated);
        mode.setStoryProgress(updated);
        const newUnlocks = dex.checkAndUnlock(updated);
        setNewlyUnlockedCharacterName(
          newUnlocks.length > 0
            ? getDexEntryById(newUnlocks[0])?.profile.fullName
            : undefined
        );
      } else {
        setNewlyUnlockedCharacterName(undefined);
      }
    } else {
      setNewlyUnlockedCharacterName(undefined);
    }
  // 意図的に screen のみを依存配列に指定:
  // winner, mode.difficulty, mode.field 等は screen が 'result' に遷移する時点で確定済み。
  // これらを依存に含めると、リザルト表示中の state 変更で副作用が再実行されてしまう。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  return {
    highScore,
    matchStats,
    newAchievements,
    suggestedDifficulty,
    unlockState,
    newlyUnlockedCharacterName,
  };
}
