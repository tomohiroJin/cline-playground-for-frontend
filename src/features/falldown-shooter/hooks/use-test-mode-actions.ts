// テストモード用操作ハンドラーフック

import { useCallback } from 'react';
import { CONFIG, HIGH_SCORE_EFFECT_DURATION } from '../constants';
import type { UseGameStateReturn } from './use-game-state';

interface UseTestModeActionsParams {
  gameState: UseGameStateReturn;
  playerX: number;
  setSkillCharge: (value: number | ((prev: number) => number)) => void;
  setShowHighScoreEffect: (show: boolean) => void;
  setSafeTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
}

const TEST_MODE_FILL_COLOR = '#888888';
const TEST_MODE_SCORE_INCREMENT = 1000;

/** テストモードのデバッグ操作をまとめたフック */
export const useTestModeActions = ({
  gameState,
  playerX,
  setSkillCharge,
  setShowHighScoreEffect,
  setSafeTimeout,
}: UseTestModeActionsParams) => {
  const handleFillRows = useCallback((rows: number) => {
    const grid = gameState.stateRef.current.grid;
    const newGrid = grid.map(row => [...row]);
    const { width: W, height: H } = CONFIG.grid;
    // プレイヤー行の1つ上から指定行数分を埋める（プレイヤーXの列だけ空ける）
    const playerRow = H - 1;
    for (let r = 0; r < rows; r++) {
      const targetRow = playerRow - 1 - r;
      if (targetRow >= 0) {
        for (let x = 0; x < W; x++) {
          newGrid[targetRow][x] = x === playerX ? null : TEST_MODE_FILL_COLOR;
        }
      }
    }
    gameState.updateState({ grid: newGrid });
  }, [gameState, playerX]);

  const handleClearGrid = useCallback(() => {
    const { width: W, height: H } = CONFIG.grid;
    const emptyGrid = Array.from({ length: H }, () => Array(W).fill(null) as (string | null)[]);
    gameState.updateState({ grid: emptyGrid, blocks: [] });
  }, [gameState]);

  const handleAddScore = useCallback(() => {
    gameState.updateState({ score: gameState.stateRef.current.score + TEST_MODE_SCORE_INCREMENT });
  }, [gameState]);

  const handleSkillMax = useCallback(() => {
    setSkillCharge(100);
  }, [setSkillCharge]);

  const handleHighScoreEffect = useCallback(() => {
    setShowHighScoreEffect(true);
    setSafeTimeout(() => setShowHighScoreEffect(false), HIGH_SCORE_EFFECT_DURATION);
  }, [setShowHighScoreEffect, setSafeTimeout]);

  return {
    handleFillRows,
    handleClearGrid,
    handleAddScore,
    handleSkillMax,
    handleHighScoreEffect,
  };
};
