// ゲームループ管理フック

import { useRef } from 'react';
import type { Difficulty, GameStatus, PowerType, ChainStep } from '../types';
import type { UseGameStateReturn } from './use-game-state';
import { CONFIG } from '../constants';
import { DIFFICULTIES } from '../difficulty';
import { Audio } from '../audio';
import { Block } from '../block';
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
  onLineClear?: (clearedLines: number) => void;
  comboMultiplier?: number;
  onChainResolved?: (chainSteps: ChainStep[]) => void;
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
  onLineClear,
  comboMultiplier,
  onChainResolved,
}: UseGameLoopParams): void => {
  const { spawnMultiplier, fallMultiplier, scoreMultiplier, powerUpChance } = DIFFICULTIES[difficulty];
  const comboMult = comboMultiplier ?? 1.0;
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

      // 弾で盤面セルを消した場合は連鎖解決（撃って引き金を引く連鎖）
      const bulletScore = Math.round(result.score * scoreMultiplier);
      let nextGrid = result.grid;
      let addedLineScore = 0;
      let clearedByChain = 0;

      if (result.hitCount > 0) {
        const resolved = GameLogic.resolveBoard(result.grid);
        nextGrid = resolved.grid;
        clearedByChain = resolved.totalLines;
        onChainResolved?.(resolved.chainSteps);
        // スコアは同色グループのセル点も含めて算出する（完全行の有無に依らず加点）
        if (resolved.chainSteps.length > 0) {
          addedLineScore = GameLogic.calcResolveScore(resolved.chainSteps, {
            stage: state.stage,
            scoreMultiplier,
            comboMult,
          });
        }
        // ライン消し音・コンボ登録は完全行が消えたときだけ
        if (clearedByChain > 0) {
          if (soundEnabled) Audio.line();
          if (onLineClear) onLineClear(clearedByChain);
        }
      }

      const newScore = state.score + bulletScore + addedLineScore;
      const newLines = state.lines + clearedByChain;

      gameState.updateState({
        bullets: result.bullets,
        blocks: result.blocks,
        grid: nextGrid,
        score: newScore,
        lines: newLines,
        playerY: GameLogic.calculatePlayerY(nextGrid),
      });

      // 弾連鎖でステージクリアに到達した場合の判定
      if (clearedByChain > 0 && newLines >= state.linesNeeded) {
        saveScore('falling-shooter', newScore, difficulty)
          .then(() => loadHighScore())
          .catch(err => console.error(err));
        setStatus(Stage.isFinal(state.stage) ? 'ending' : 'clear');
        // クリア画面へ遷移する場合は、後続の爆弾処理（grid/score変更・演出）をスキップする
        return;
      }

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
      const resolved = GameLogic.resolveBoard(gridWithLanded);
      const cleared = resolved.totalLines;
      onChainResolved?.(resolved.chainSteps);

      if (cleared > 0) {
        if (soundEnabled) Audio.line();
        if (onLineClear) onLineClear(cleared);
      }

      const newLines = state.lines + cleared;
      const newPlayerY = GameLogic.calculatePlayerY(resolved.grid);
      // 連鎖倍率込みのライン得点（comboMult はこの着地時点の値で固定）
      const lineScore = GameLogic.calcResolveScore(resolved.chainSteps, {
        stage: state.stage,
        scoreMultiplier,
        comboMult,
      });
      const finalScore = state.score + lineScore;

      gameState.updateState({
        blocks: falling,
        grid: resolved.grid,
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

      if (GameLogic.isGameOver(resolved.grid)) {
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
