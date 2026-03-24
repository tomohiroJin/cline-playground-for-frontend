// ============================================================================
// Deep Sea Interceptor - カスタムフック
// ============================================================================

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { getHighScore, saveScore } from '../../utils/score-storage';
import { createAudioSystem } from './audio';
import { Config, DifficultyConfig, WEAPON_COOLDOWN } from './constants';
import { createInitialGameState, createInitialUiState, updateFrame, calculateRank } from './game-logic';
import { createBulletsForWeapon, createChargedShot } from './weapon';
import { loadAchievements, saveAchievements, checkNewAchievements } from './achievements';
import { checkTestModeInput } from './test-mode';
import type { GameState, UiState, WeaponType, Difficulty, Achievement } from './types';

/** ゲーム画面の状態 */
export type ScreenState = 'title' | 'playing' | 'gameover' | 'ending';

const GAME_KEY = 'deep_sea_shooter';

/** ゲーム操作に使用するキーの一覧 */
const GAME_CONTROL_KEYS = [
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
] as const;

// ----------------------------------------------------------------------------
// useTestMode - テストモード入力検知フック
// ----------------------------------------------------------------------------

/** テストモードの状態管理に必要な引数 */
interface UseTestModeArgs {
  gameState: ScreenState;
  audio: React.MutableRefObject<ReturnType<typeof createAudioSystem>>;
}

/** タイトル画面でのキー入力によるテストモード検知を管理する */
function useTestMode({ gameState, audio }: UseTestModeArgs) {
  const [testMode, setTestMode] = useState(false);
  const testModeBuffer = useRef('');

  // テストモード入力検知（タイトル画面のみ）
  useEffect(() => {
    if (gameState !== 'title') return;
    const handleTestModeInput = (e: KeyboardEvent) => {
      if (e.type !== 'keydown') return;
      const key = e.key.toLowerCase();
      if (/^[a-z]$/.test(key)) {
        testModeBuffer.current += key;
        // バッファを最新20文字に制限
        if (testModeBuffer.current.length > 20) {
          testModeBuffer.current = testModeBuffer.current.slice(-20);
        }
        const result = checkTestModeInput(testModeBuffer.current);
        if (result.activated && !testMode) {
          setTestMode(true);
          testModeBuffer.current = '';
          audio.current.init();
          audio.current.play('testModeActivated');
        }
      }
    };
    window.addEventListener('keydown', handleTestModeInput);
    return () => window.removeEventListener('keydown', handleTestModeInput);
  }, [gameState, testMode, audio]);

  // タイトルに戻った時にテストモード解除（ゲーム終了→タイトル遷移時のみ）
  const prevGameState = useRef<ScreenState>(gameState);
  useEffect(() => {
    if (prevGameState.current !== 'title' && gameState === 'title') {
      setTestMode(false);
      testModeBuffer.current = '';
    }
    prevGameState.current = gameState;
  }, [gameState]);

  return { testMode };
}

// ----------------------------------------------------------------------------
// ゲーム終了時の処理（実績チェック・スコア保存）
// ----------------------------------------------------------------------------

/** ゲーム終了時の実績チェックとスコア保存を行う */
function handleGameEnd(
  event: 'gameover' | 'ending',
  gameData: GameState,
  resultUiState: UiState,
  isTestMode: boolean,
  audioRef: ReturnType<typeof createAudioSystem>,
  setNewAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
) {
  // テストモードでなければスコアを保存
  if (!isTestMode) {
    saveScore(GAME_KEY, resultUiState.score);
  }

  // 実績チェック
  const playTime = Date.now() - (gameData.gameStartTime || Date.now());
  const rank = calculateRank(resultUiState.score, resultUiState.lives, resultUiState.difficulty);
  const stats = {
    score: resultUiState.score,
    maxCombo: gameData.maxCombo,
    grazeCount: gameData.grazeCount,
    livesLost: DifficultyConfig[resultUiState.difficulty].initialLives - resultUiState.lives,
    playTime,
    difficulty: resultUiState.difficulty,
    weaponType: resultUiState.weaponType,
    stagesCleared: event === 'ending' ? 5 : resultUiState.stage - 1,
    rank,
  };
  const saved = loadAchievements();
  const newAch = checkNewAchievements(stats, saved);
  if (newAch.length > 0) {
    saved.unlockedIds.push(...newAch.map(a => a.id));
    saved.lastUpdated = Date.now();
    saveAchievements(saved);
    setNewAchievements(newAch);
    audioRef.play('achievement');
  } else {
    setNewAchievements([]);
  }
}

// ----------------------------------------------------------------------------
// ショット・チャージの入力処理関数
// ----------------------------------------------------------------------------

/** 通常ショットの発射処理 */
function fireShot(
  gameData: GameState,
  weaponType: WeaponType,
  power: number,
  spreadTime: number,
  audioRef: ReturnType<typeof createAudioSystem>
) {
  const now = Date.now();
  const cooldown = WEAPON_COOLDOWN[weaponType];
  if (now - gameData.lastShotTime >= cooldown) {
    const hasSpread = spreadTime > now;
    const newBullets = createBulletsForWeapon(
      gameData.player.x,
      gameData.player.y,
      weaponType,
      power,
      hasSpread
    );
    gameData.bullets.push(...newBullets);
    gameData.lastShotTime = now;
    audioRef.play('shot');
  }
}

/** チャージショットの解放処理 */
function releaseCharge(
  gameData: GameState,
  weaponType: WeaponType,
  audioRef: ReturnType<typeof createAudioSystem>
) {
  if (gameData.charging) {
    if (gameData.chargeLevel >= 0.8) {
      gameData.bullets.push(...createChargedShot(gameData.player.x, gameData.player.y, weaponType));
      audioRef.play('charged');
    }
    gameData.charging = false;
    gameData.chargeLevel = 0;
  }
}

// ----------------------------------------------------------------------------
// useDeepSeaGame - メインゲームフック
// ----------------------------------------------------------------------------

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

  // テストモード管理
  const { testMode } = useTestMode({ gameState, audio });

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
    const isTestMode = testMode;
    setUiState(p => ({
      ...p,
      score: 0,
      lives: isTestMode ? 99 : diffConfig.initialLives,
      power: isTestMode ? Config.player.maxPower : 1,
      stage: 1,
      shieldEndTime: isTestMode ? Infinity : 0,
      speedLevel: isTestMode ? Config.player.maxSpeedLevel : 0,
      spreadTime: isTestMode ? Infinity : 0,
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
  }, [selectedWeapon, selectedDifficulty, testMode]);

  // チャージ処理
  const handleCharge = useCallback(() => {
    releaseCharge(gameData.current, selectedWeapon, audio.current);
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
      if ((GAME_CONTROL_KEYS as readonly string[]).includes(k)) {
        if (e.preventDefault) e.preventDefault();
        gameData.current.keys[k] = isDown;

        // ショット発射（z キー）
        if (isDown && (k === 'z' || k === 'Z') && gameState === 'playing') {
          fireShot(gameData.current, uiState.weaponType, uiState.power, uiState.spreadTime, audio.current);
        }
        // チャージ操作（x キー）
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
        (name: string) => {
          if (name === 'warning') {
            audio.current.playWarningSiren();
          } else {
            audio.current.play(name);
          }
        }
      );

      uiStateRef.current = result.uiState;
      setUiState(result.uiState);

      if (result.event === 'gameover' || result.event === 'ending') {
        setGameState(result.event === 'ending' ? 'ending' : 'gameover');
        handleGameEnd(
          result.event as 'gameover' | 'ending',
          gameData.current,
          result.uiState,
          testMode,
          audio.current,
          setNewAchievements
        );
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
    fireShot(gameData.current, selectedWeapon, uiState.power, uiState.spreadTime, audio.current);
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
    testMode,
  };
}
