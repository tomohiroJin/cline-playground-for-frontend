// ============================================================================
// Deep Sea Interceptor - カスタムフック
// ============================================================================

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { getHighScore, saveScore } from '../../utils/score-storage';
import { createAudioSystem } from './audio';
import { Config, DifficultyConfig } from './constants';
import { EntityFactory } from './entities';
import { createInitialGameState, createInitialUiState, updateFrame } from './game-logic';
import type { GameState, UiState, WeaponType, Difficulty } from './types';

/** ゲーム画面の状態 */
export type ScreenState = 'title' | 'playing' | 'gameover' | 'ending';

const GAME_KEY = 'deep_sea_shooter';

/** 武器タイプ別の射撃ロジック */
function createBulletsForWeapon(
  x: number,
  y: number,
  weaponType: WeaponType,
  power: number,
  hasSpread: boolean
) {
  const bullets = [];

  switch (weaponType) {
    case 'torpedo': {
      // トーピード: power レベルに応じた弾数
      const angles = hasSpread
        ? [-0.25, 0, 0.25]
        : power >= 5
          ? [-0.1, 0, 0.1, 0]
          : power >= 4
            ? [-0.1, 0, 0.1]
            : power >= 3
              ? [-0.1, 0.1]
              : [0];
      for (const a of angles) {
        bullets.push(
          EntityFactory.bullet(x, y - 12, {
            angle: -Math.PI / 2 + a,
            weaponType: 'torpedo',
            damage: power >= 2 && a === 0 ? 1.5 : 1,
          })
        );
      }
      break;
    }
    case 'sonarWave': {
      // ソナーウェーブ: 扇状3発、射程制限あり
      const spreadAngle = power >= 5 ? 0.35 : power >= 3 ? 0.26 : 0.17;
      const lifespan = power >= 5 ? 30 : power >= 3 ? 25 : 20;
      const dmg = power >= 5 ? 2 : 1;
      for (const a of [-spreadAngle, 0, spreadAngle]) {
        bullets.push(
          EntityFactory.bullet(x, y - 12, {
            angle: -Math.PI / 2 + a,
            weaponType: 'sonarWave',
            speed: 8,
            damage: dmg,
            lifespan,
          })
        );
      }
      break;
    }
    case 'bioMissile': {
      // バイオミサイル: ホーミング弾
      const count = power >= 5 ? 3 : power >= 3 ? 2 : 1;
      const dmg = power >= 5 ? 1 : 1;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 0.2;
        bullets.push(
          EntityFactory.bullet(x, y - 12, {
            angle: -Math.PI / 2 + offset,
            weaponType: 'bioMissile',
            speed: 7,
            damage: dmg,
            homing: true,
          })
        );
      }
      break;
    }
  }

  return bullets;
}

/** Deep Sea Interceptor のメインゲームフック */
export function useDeepSeaGame() {
  const [gameState, setGameState] = useState<ScreenState>('title');
  const [uiState, setUiState] = useState<UiState>(createInitialUiState());
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('torpedo');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('standard');
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
        // 武器タイプ別チャージショット
        switch (selectedWeapon) {
          case 'torpedo':
            gd.bullets.push(
              EntityFactory.bullet(gd.player.x, gd.player.y - 12, {
                charged: true,
                weaponType: 'torpedo',
                piercing: true,
                damage: 5,
              })
            );
            break;
          case 'sonarWave':
            // 全方位8発パルス
            for (let i = 0; i < 8; i++) {
              const angle = (Math.PI * 2 * i) / 8;
              gd.bullets.push(
                EntityFactory.bullet(gd.player.x, gd.player.y, {
                  charged: true,
                  weaponType: 'sonarWave',
                  angle,
                  speed: 6,
                  damage: 3,
                  lifespan: 25,
                })
              );
            }
            break;
          case 'bioMissile':
            // 追尾型拡散5発
            for (let i = 0; i < 5; i++) {
              const offset = (i - 2) * 0.3;
              gd.bullets.push(
                EntityFactory.bullet(gd.player.x, gd.player.y - 12, {
                  charged: true,
                  weaponType: 'bioMissile',
                  angle: -Math.PI / 2 + offset,
                  speed: 8,
                  damage: 2,
                  homing: true,
                })
              );
            }
            break;
        }
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
  };
}
