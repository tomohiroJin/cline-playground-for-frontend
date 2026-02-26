// ゲームフロー管理フック

import { useState, useCallback, useEffect } from 'react';
import type { Difficulty, GameStatus, Powers } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG } from '../constants';
import { Audio } from '../audio';
import { getHighScore } from '../../../utils/score-storage';

const { width: W } = CONFIG.grid;
const DEFAULT_POWERS: Powers = { triple: false, pierce: false, slow: false, downshot: false };

export interface UseGameFlowParams {
  difficulty: Difficulty;
  gameState: UseGameStateReturn;
  status: GameStatus;
  setStatus: (status: GameStatus) => void;
  setPlayerX: (x: number | ((prev: number) => number)) => void;
  setPowers: (p: Powers | ((prev: Powers) => Powers)) => void;
  setExplosions: (e: React.SetStateAction<{ id: string; x: number; y: number }[]>) => void;
  setLaserX: (x: number | null) => void;
  setShowBlast: (v: boolean) => void;
  setSkillCharge: (c: number | ((prev: number) => number)) => void;
  setShowDemo: (v: boolean) => void;
  setCanFire: (v: boolean) => void;
  soundEnabled: boolean;
  spawnTimeRef: React.MutableRefObject<number>;
  prevScoreRef: React.MutableRefObject<number>;
}

export interface UseGameFlowReturn {
  status: GameStatus;
  setStatus: (status: GameStatus) => void;
  highScore: number;
  startStage: (num: number, score?: number) => void;
  goToTitle: () => void;
  resetGame: () => void;
  nextStage: () => void;
  loadHighScore: () => void;
}

export const useGameFlow = ({
  difficulty,
  gameState,
  status,
  setStatus,
  setPlayerX,
  setPowers,
  setExplosions,
  setLaserX,
  setShowBlast,
  setSkillCharge,
  setShowDemo,
  setCanFire,
  soundEnabled,
  spawnTimeRef,
  prevScoreRef,
}: UseGameFlowParams): UseGameFlowReturn => {
  const [highScore, setHighScore] = useState<number>(0);

  const loadHighScore = useCallback(() => {
    getHighScore('falling-shooter', difficulty).then(setHighScore);
  }, [difficulty]);

  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  const startStage = useCallback(
    (num: number, score: number = 0) => {
      gameState.resetState(num, score);
      prevScoreRef.current = score;
      setPlayerX(Math.floor(W / 2));
      setCanFire(true);
      setPowers(DEFAULT_POWERS);
      setExplosions([]);
      setLaserX(null);
      setShowBlast(false);
      spawnTimeRef.current = 0;
      setStatus('playing');
      setShowDemo(false);
    },
    [gameState, setPlayerX, setPowers, setExplosions, setLaserX, setShowBlast, setShowDemo, setCanFire, setStatus, spawnTimeRef, prevScoreRef]
  );

  const goToTitle = useCallback(() => {
    gameState.resetState(1, 0);
    prevScoreRef.current = 0;
    setPlayerX(Math.floor(W / 2));
    setPowers(DEFAULT_POWERS);
    setExplosions([]);
    setSkillCharge(0);
    setStatus('idle');
  }, [gameState, setPlayerX, setPowers, setExplosions, setSkillCharge, setStatus, prevScoreRef]);

  const resetGame = useCallback(() => {
    setSkillCharge(0);
    startStage(1, 0);
  }, [startStage, setSkillCharge]);

  const nextStage = useCallback(() => {
    const st = gameState.stateRef.current;
    if (soundEnabled) Audio.win();
    startStage(st.stage + 1, st.score);
  }, [startStage, gameState, soundEnabled]);

  return {
    status,
    setStatus,
    highScore,
    startStage,
    goToTitle,
    resetGame,
    nextStage,
    loadHighScore,
  };
};
