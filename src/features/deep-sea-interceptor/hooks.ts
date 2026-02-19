// ============================================================================
// Deep Sea Interceptor - カスタムフック
// ============================================================================

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { getHighScore, saveScore } from '../../utils/score-storage';
import { createAudioSystem } from './audio';
import { Config } from './constants';
import { EntityFactory } from './entities';
import { createInitialGameState, createInitialUiState, updateFrame } from './game-logic';
import type { GameState, UiState } from './types';

/** ゲーム画面の状態 */
export type ScreenState = 'title' | 'playing' | 'gameover' | 'ending';

const GAME_KEY = 'deep_sea_shooter';

/** Deep Sea Interceptor のメインゲームフック */
export function useDeepSeaGame() {
  const [gameState, setGameState] = useState<ScreenState>('title');
  const [uiState, setUiState] = useState<UiState>(createInitialUiState());
  const [, forceRender] = useReducer(x => x + 1, 0) as [number, () => void];

  const gameData = useRef<GameState>(createInitialGameState());
  const audio = useRef(createAudioSystem());
  const raf = useRef<number | null>(null);

  // ハイスコア読み込み
  useEffect(() => {
    getHighScore(GAME_KEY).then(h => {
      setUiState(prev => ({ ...prev, highScore: h }));
    });
  }, []);

  // ゲーム開始
  const startGame = useCallback(() => {
    audio.current.init();
    gameData.current = createInitialGameState();
    setUiState(p => ({
      ...p,
      score: 0,
      lives: 3,
      power: 1,
      stage: 1,
      shieldEndTime: 0,
      speedLevel: 0,
      spreadTime: 0,
      combo: 0,
      multiplier: 1.0,
      grazeCount: 0,
      maxCombo: 0,
    }));
    getHighScore(GAME_KEY).then(highScore => {
      setUiState(p => ({ ...p, highScore }));
    });
    setGameState('playing');
  }, []);

  // チャージ処理
  const handleCharge = useCallback((e: { type: string }) => {
    const gd = gameData.current;
    if (e.type === 'touchstart' || e.type === 'mousedown') {
      gd.charging = true;
      gd.chargeStartTime = Date.now();
    } else if (gd.charging) {
      if (gd.chargeLevel >= 0.8) {
        gd.bullets.push(EntityFactory.bullet(gd.player.x, gd.player.y - 12, { charged: true }));
        audio.current.play('charged');
      }
      gd.charging = false;
      gd.chargeLevel = 0;
    }
  }, []);

  // キーボード入力
  const handleInput = useCallback(
    (e: KeyboardEvent) => {
      const k = e.key;
      const isDown = e.type === 'keydown';
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'w',
          'a',
          's',
          'd',
          'z',
          'x',
          ' ',
        ].includes(k)
      ) {
        if (e.preventDefault) e.preventDefault();
        gameData.current.keys[k] = isDown;

        if (isDown && (k === 'z' || k === 'Z') && gameState === 'playing') {
          const gd = gameData.current;
          const hasSpread = uiState.spreadTime > Date.now();
          const angles = hasSpread ? [-0.25, 0, 0.25] : uiState.power >= 3 ? [-0.1, 0.1] : [0];
          angles.forEach(a =>
            gd.bullets.push(
              EntityFactory.bullet(gd.player.x, gd.player.y - 12, { angle: -Math.PI / 2 + a })
            )
          );
          audio.current.play('shot');
        }
        if ((k === 'x' || k === 'X') && gameState === 'playing') {
          if (isDown && !gameData.current.charging) {
            gameData.current.charging = true;
            gameData.current.chargeStartTime = Date.now();
          } else if (!isDown && gameData.current.charging) {
            handleCharge({ type: 'mouseup' });
          }
        }
      }
    },
    [gameState, uiState.power, uiState.spreadTime, handleCharge]
  );

  // キーボードイベントリスナー
  useEffect(() => {
    window.addEventListener('keydown', handleInput);
    window.addEventListener('keyup', handleInput);
    return () => {
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('keyup', handleInput);
    };
  }, [handleInput]);

  // ゲームループ
  useEffect(() => {
    if (gameState !== 'playing') return;

    const uiStateRef = { current: uiState };
    const loop = () => {
      const now = Date.now();
      const result = updateFrame(
        gameData.current,
        uiStateRef.current,
        now,
        (name: string) => audio.current.play(name)
      );

      uiStateRef.current = result.uiState;
      setUiState(result.uiState);

      if (result.event === 'gameover') {
        setGameState('gameover');
        saveScore(GAME_KEY, result.uiState.score);
      } else if (result.event === 'ending') {
        setGameState('ending');
        saveScore(GAME_KEY, result.uiState.score);
      }

      forceRender();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // タッチ射撃
  const handleTouchShoot = useCallback(() => {
    const gd = gameData.current;
    gd.bullets.push(EntityFactory.bullet(gd.player.x, gd.player.y - 12));
    audio.current.play('shot');
  }, []);

  // タッチ移動
  const handleTouchMove = useCallback((dx: number, dy: number) => {
    gameData.current.input = { dx, dy };
  }, []);

  return {
    gameState,
    setGameState,
    uiState,
    gameData,
    startGame,
    handleCharge,
    handleTouchShoot,
    handleTouchMove,
  };
}
