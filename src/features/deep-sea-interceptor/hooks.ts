// ============================================================================
// Deep Sea Interceptor - カスタムフック
// ============================================================================

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { getHighScore, saveScore } from '../../utils/score-storage';
import { createAudioSystem } from './audio';
import { DifficultyConfig } from './constants';
import { createInitialGameState, createInitialUiState, updateFrame, calculateRank } from './game-logic';
import { createBulletsForWeapon, createChargedShot } from './weapon';
import { loadAchievements, saveAchievements, checkNewAchievements } from './achievements';
import type { GameState, UiState, WeaponType, Difficulty, Achievement } from './types';

/** ゲーム画面の状態 */
export type ScreenState = 'title' | 'playing' | 'gameover' | 'ending';

const GAME_KEY = 'deep_sea_shooter';

/** Deep Sea Interceptor のメインゲームフック */
export function useDeepSeaGame() {
  const [gameState, setGameState] = useState<ScreenState>('title');
  const [uiState, setUiState] = useState<UiState>(createInitialUiState());
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('torpedo');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('standard');
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
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
    setNewAchievements([]);
    const diffConfig = DifficultyConfig[selectedDifficulty];
    gameData.current = createInitialGameState();
    gameData.current.gameStartTime = Date.now();
    setUiState(p => ({
      ...p,
      score: 0,
      lives: diffConfig.initialLives,
      power: 1,
      stage: 1,
      shieldEndTime: 0,
      speedLevel: 0,
      spreadTime: 0,
      combo: 0,
      multiplier: 1.0,
      grazeCount: 0,
      maxCombo: 0,
      difficulty: selectedDifficulty,
      weaponType: selectedWeapon,
    }));
    getHighScore(GAME_KEY).then(highScore => {
      setUiState(p => ({ ...p, highScore }));
    });
    setGameState('playing');
  }, [selectedWeapon, selectedDifficulty]);

  // チャージ処理
  const handleCharge = useCallback(() => {
    const gd = gameData.current;
    if (gd.charging) {
      if (gd.chargeLevel >= 0.8) {
        gd.bullets.push(...createChargedShot(gd.player.x, gd.player.y, selectedWeapon));
        audio.current.play('charged');
      }
      gd.charging = false;
      gd.chargeLevel = 0;
    }
  }, [selectedWeapon]);

  // チャージ開始/終了処理
  const handleChargeEvent = useCallback(
    (e: { type: string }) => {
      const gd = gameData.current;
      if (e.type === 'touchstart' || e.type === 'mousedown') {
        gd.charging = true;
        gd.chargeStartTime = Date.now();
      } else {
        handleCharge();
      }
    },
    [handleCharge]
  );

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
          const newBullets = createBulletsForWeapon(
            gd.player.x,
            gd.player.y,
            uiState.weaponType,
            uiState.power,
            hasSpread
          );
          gd.bullets.push(...newBullets);
          audio.current.play('shot');
        }
        if ((k === 'x' || k === 'X') && gameState === 'playing') {
          if (isDown && !gameData.current.charging) {
            gameData.current.charging = true;
            gameData.current.chargeStartTime = Date.now();
          } else if (!isDown && gameData.current.charging) {
            handleCharge();
          }
        }
      }
    },
    [gameState, uiState.power, uiState.spreadTime, uiState.weaponType, handleCharge]
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

      if (result.event === 'gameover' || result.event === 'ending') {
        setGameState(result.event === 'ending' ? 'ending' : 'gameover');
        saveScore(GAME_KEY, result.uiState.score);
        // 実績チェック
        const gd = gameData.current;
        const ui = result.uiState;
        const playTime = Date.now() - (gd.gameStartTime || Date.now());
        const rank = calculateRank(ui.score, ui.lives, ui.difficulty);
        const stats = {
          score: ui.score,
          maxCombo: gd.maxCombo,
          grazeCount: gd.grazeCount,
          livesLost: DifficultyConfig[ui.difficulty].initialLives - ui.lives,
          playTime,
          difficulty: ui.difficulty,
          weaponType: ui.weaponType,
          stagesCleared: result.event === 'ending' ? 5 : ui.stage - 1,
          rank,
        };
        const saved = loadAchievements();
        const newAch = checkNewAchievements(stats, saved);
        if (newAch.length > 0) {
          saved.unlockedIds.push(...newAch.map(a => a.id));
          saved.lastUpdated = Date.now();
          saveAchievements(saved);
          setNewAchievements(newAch);
          audio.current.play('achievement');
        } else {
          setNewAchievements([]);
        }
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
    const newBullets = createBulletsForWeapon(
      gd.player.x,
      gd.player.y,
      selectedWeapon,
      uiState.power,
      uiState.spreadTime > Date.now()
    );
    gd.bullets.push(...newBullets);
    audio.current.play('shot');
  }, [selectedWeapon, uiState.power, uiState.spreadTime]);

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
    handleCharge: handleChargeEvent,
    handleTouchShoot,
    handleTouchMove,
    selectedWeapon,
    setSelectedWeapon,
    selectedDifficulty,
    setSelectedDifficulty,
    newAchievements,
  };
}
