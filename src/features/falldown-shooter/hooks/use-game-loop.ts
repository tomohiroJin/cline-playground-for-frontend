// ゲームループ管理フック

import { useRef } from 'react';
import type { Difficulty, GameStatus, PowerType } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG } from '../constants';
import { DIFFICULTIES } from '../difficulty';
import { Audio } from '../audio';
import { Block } from '../block';
import { Grid } from '../grid';
import { GameLogic } from '../game-logic';
import { Stage } from '../stage';
import { useInterval } from '../hooks';
import { saveScore } from '../../../utils/score-storage';

const { width: W, height: H } = CONFIG.grid;

export interface UseGameLoopParams {
  gameState: UseGameStateReturn;
  isPlaying: boolean;
  powers: { slow: boolean };
  soundEnabled: boolean;
  handlePowerUp: (type: PowerType, x: number, y: number) => void;
  setStatus: (status: GameStatus) => void;
  loadHighScore: () => void;
  difficulty: Difficulty;
}

export const useGameLoop = ({
  gameState,
  isPlaying,
  powers,
  soundEnabled,
  handlePowerUp,
  setStatus,
  loadHighScore,
  difficulty,
}: UseGameLoopParams): void => {
  const { spawnMultiplier, fallMultiplier, scoreMultiplier, powerUpChance } = DIFFICULTIES[difficulty];
  const spawnTimeRef = useRef<number>(0);

  // タイマー（1秒ごとに time を加算）
  useInterval(
    () => gameState.updateState({ time: gameState.stateRef.current.time + 1 }),
    1000,
    isPlaying
  );

  // ブロックスポーン
  useInterval(
    () => {
      const state = gameState.stateRef.current;
      const now = Date.now();
      const spawnInterval = GameLogic.getSpawnInterval(state.time, state.stage, spawnMultiplier);

      if (now - spawnTimeRef.current > spawnInterval) {
        if (GameLogic.canSpawnBlock(state.blocks)) {
          gameState.updateState({
            blocks: [...state.blocks, Block.create(W, state.blocks, powerUpChance)],
          });
          spawnTimeRef.current = now;
        }
      }
    },
    100,
    isPlaying
  );

  // 弾の処理と衝突判定
  useInterval(
    () => {
      const state = gameState.stateRef.current;
      if (!state.bullets.length) return;

      const result = GameLogic.processBullets(
        state.bullets,
        state.blocks,
        state.grid,
        W,
        H,
        handlePowerUp
      );

      if (result.hitCount > 0 && soundEnabled) Audio.hit();

      gameState.updateState({
        bullets: result.bullets,
        blocks: result.blocks,
        grid: result.grid,
        score: state.score + Math.round(result.score * scoreMultiplier),
      });

      result.pendingBombs.forEach(({ x, y }) => handlePowerUp('bomb', x, y));
    },
    CONFIG.timing.bullet.speed,
    isPlaying
  );

  // ブロック落下
  useInterval(
    () => {
      const state = gameState.stateRef.current;
      if (!state.blocks.length) return;

      const { falling, landing } = GameLogic.processBlockFalling(state.blocks, state.grid, H);

      if (!landing.length) {
        gameState.updateState({ blocks: falling });
        return;
      }

      if (soundEnabled) Audio.land();

      const gridWithLanded = Block.placeOnGrid(landing, state.grid);
      const { grid: clearedGrid, cleared } = Grid.clearFullLines(gridWithLanded);

      if (cleared > 0 && soundEnabled) Audio.line();

      const newLines = state.lines + cleared;
      const newPlayerY = GameLogic.calculatePlayerY(clearedGrid);
      const lineScore = Math.round(cleared * CONFIG.score.line * state.stage * scoreMultiplier);
      const finalScore = state.score + lineScore;

      gameState.updateState({
        blocks: falling,
        grid: clearedGrid,
        playerY: newPlayerY,
        score: finalScore,
        lines: newLines,
      });

      if (newLines >= state.linesNeeded) {
        saveScore('falling-shooter', finalScore, difficulty)
          .then(() => loadHighScore())
          .catch(err => console.error(err));
        setStatus(Stage.isFinal(state.stage) ? 'ending' : 'clear');
        return;
      }

      if (GameLogic.isGameOver(clearedGrid)) {
        if (soundEnabled) Audio.over();
        saveScore('falling-shooter', finalScore, difficulty)
          .then(() => loadHighScore())
          .catch(err => console.error(err));
        setStatus('over');
      }
    },
    GameLogic.getFallSpeed(
      gameState.stateRef.current.time,
      gameState.stateRef.current.stage,
      powers.slow,
      fallMultiplier
    ),
    isPlaying
  );
};
