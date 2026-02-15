/**
 * ゲーム状態管理フック
 * 画面遷移、BGM切り替え、音声設定のハンドラーを集約
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createMapWithRooms,
  createPlayer,
  findStartPosition,
  findGoalPosition,
  ScreenState,
  GameMap,
  Player,
  Enemy,
  Item,
  Room,
  CombatState,
  ScreenStateValue,
  AutoMapState,
  initExploration,
  updateExploration,
  Position,
  DebugState,
  initDebugState,
  spawnEnemies,
  spawnItems,
  PlayerClass,
  PlayerClassValue,
  Trap,
  Wall,
  placeGimmicks,
} from '../../index';
import { createTimer, startTimer, GameTimer } from '../../timer';
import { RatingValue, AudioSettings } from '../../types';
import {
  enableAudio,
  initializeAudioSettings,
  getAudioSettings,
  setMasterVolume,
  setSeVolume,
  setBgmVolume,
  toggleMute as toggleMuteAudio,
  playTitleBgm,
  playGameBgm,
  playClearJingle,
  playGameOverJingle,
  stopBgm,
  playGameClearSound,
  playGameOverSound,
} from '../../audio';
import { useSyncedState } from '../state/useSyncedState';

/**
 * ゲーム状態管理フックの戻り値型定義
 */
export interface GameState {
  // 画面状態
  screen: ScreenStateValue;
  setScreen: React.Dispatch<React.SetStateAction<ScreenStateValue>>;
  // マップ・エンティティ
  map: GameMap;
  setMap: (map: GameMap) => void;
  mapRef: React.MutableRefObject<GameMap>;
  player: Player;
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  playerRef: React.MutableRefObject<Player>;
  enemies: Enemy[];
  setEnemies: (enemies: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  enemiesRef: React.MutableRefObject<Enemy[]>;
  items: Item[];
  setItems: (items: Item[] | ((prev: Item[]) => Item[])) => void;
  itemsRef: React.MutableRefObject<Item[]>;
  goalPos: { x: number; y: number };
  mapState: AutoMapState;
  setMapState: React.Dispatch<React.SetStateAction<AutoMapState>>;
  debugState: DebugState;
  setDebugState: React.Dispatch<React.SetStateAction<DebugState>>;
  isGameOver: boolean;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  combatState: CombatState;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState>>;
  attackEffect: { position: Position; until: number } | undefined;
  setAttackEffect: React.Dispatch<React.SetStateAction<{ position: Position; until: number } | undefined>>;
  // MVP3
  selectedClass: PlayerClassValue;
  traps: Trap[];
  setTraps: (traps: Trap[] | ((prev: Trap[]) => Trap[])) => void;
  trapsRef: React.MutableRefObject<Trap[]>;
  walls: Wall[];
  setWalls: (walls: Wall[] | ((prev: Wall[]) => Wall[])) => void;
  wallsRef: React.MutableRefObject<Wall[]>;
  pendingLevelPoints: number;
  setPendingLevelPoints: (points: number | ((prev: number) => number)) => void;
  pendingLevelPointsRef: React.MutableRefObject<number>;
  showLevelUpModal: boolean;
  setShowLevelUpModal: React.Dispatch<React.SetStateAction<boolean>>;
  // MVP4
  timer: GameTimer;
  setTimer: React.Dispatch<React.SetStateAction<GameTimer>>;
  showHelp: boolean;
  clearTime: number;
  setClearTime: React.Dispatch<React.SetStateAction<number>>;
  clearRating: RatingValue;
  setClearRating: React.Dispatch<React.SetStateAction<RatingValue>>;
  isNewBest: boolean;
  setIsNewBest: React.Dispatch<React.SetStateAction<boolean>>;
  // MVP5
  audioSettings: AudioSettings;
  showAudioSettings: boolean;
  isAudioReady: boolean;
  // MVP6
  showKeyRequiredMessage: boolean;
  setShowKeyRequiredMessage: React.Dispatch<React.SetStateAction<boolean>>;
  // ハンドラー
  handleStartGame: () => void;
  handleClassSelect: (playerClass: PlayerClassValue) => void;
  handleSkipPrologue: () => void;
  handleRetry: () => void;
  handleGameOverRetry: () => void;
  handleBackToTitle: () => void;
  handleHelpToggle: () => void;
  handleEnableAudio: () => Promise<void>;
  handleAudioSettingsToggle: () => void;
  handleMasterVolumeChange: (value: number) => void;
  handleSeVolumeChange: (value: number) => void;
  handleBgmVolumeChange: (value: number) => void;
  handleToggleMute: () => void;
}

/**
 * ゲーム状態管理フック
 */
export function useGameState(): GameState {
  const [screen, setScreen] = useState<ScreenStateValue>(ScreenState.TITLE);
  const [map, setMap, mapRef] = useSyncedState<GameMap>([]);
  const [player, setPlayer, playerRef] = useSyncedState<Player>(createPlayer(0, 0));
  const [enemies, setEnemies, enemiesRef] = useSyncedState<Enemy[]>([]);
  const [items, setItems, itemsRef] = useSyncedState<Item[]>([]);
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapState, setMapState] = useState<AutoMapState>({
    exploration: [],
    isMapVisible: true,
    isFullScreen: false,
  });
  const [debugState, setDebugState] = useState<DebugState>(() => initDebugState());
  const [isGameOver, setIsGameOver] = useState(false);
  const [combatState, setCombatState] = useState<CombatState>({ lastAttackAt: 0, lastDamageAt: 0 });
  const [attackEffect, setAttackEffect] = useState<{ position: Position; until: number } | undefined>(undefined);

  // MVP3追加
  const [selectedClass, setSelectedClass] = useState<PlayerClassValue>(PlayerClass.WARRIOR);
  const [traps, setTraps, trapsRef] = useSyncedState<Trap[]>([]);
  const [walls, setWalls, wallsRef] = useSyncedState<Wall[]>([]);
  const [pendingLevelPoints, setPendingLevelPoints, pendingLevelPointsRef] = useSyncedState(0);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  // MVP4追加
  const [timer, setTimer] = useState<GameTimer>(() => createTimer());
  const [showHelp, setShowHelp] = useState(false);
  const [clearTime, setClearTime] = useState(0);
  const [clearRating, setClearRating] = useState<RatingValue>('d');
  const [isNewBest, setIsNewBest] = useState(false);

  // MVP6追加
  const [showKeyRequiredMessage, setShowKeyRequiredMessage] = useState(false);

  // MVP5追加: 音声関連
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => initializeAudioSettings());
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const roomsRef = useRef<Room[]>([]);

  // ゲーム状態セットアップ
  const setupGameState = useCallback((newMap: GameMap, rooms: Room[], playerClass: PlayerClassValue) => {
    const startPos = findStartPosition(newMap);
    const goal = findGoalPosition(newMap);

    if (!startPos || !goal) return;

    setMap(newMap);
    setGoalPos(goal);
    const createdPlayer = createPlayer(startPos.x, startPos.y, playerClass);
    setPlayer(createdPlayer);
    setIsGameOver(false);
    setPendingLevelPoints(0);
    setShowLevelUpModal(false);
    setCombatState({ lastAttackAt: 0, lastDamageAt: 0 });
    setAttackEffect(undefined);

    const newTimer = startTimer(createTimer());
    setTimer(newTimer);
    setShowHelp(false);
    setClearTime(0);
    setIsNewBest(false);

    roomsRef.current = rooms;

    const spawnedEnemies = spawnEnemies(rooms, startPos, goal);
    const spawnedItems = spawnItems(rooms, spawnedEnemies, [startPos, goal], goal);
    setEnemies(spawnedEnemies);
    setItems(spawnedItems);

    const gimmickResult = placeGimmicks(rooms, newMap, [startPos, goal], undefined, startPos, goal);
    setTraps(gimmickResult.traps);
    setWalls(gimmickResult.walls);

    const exploration = initExploration(newMap[0].length, newMap.length);
    const updatedExploration = updateExploration(exploration, startPos, newMap);
    setMapState({
      exploration: updatedExploration,
      isMapVisible: true,
      isFullScreen: false,
    });
  }, [setEnemies, setItems, setMap, setPendingLevelPoints, setPlayer, setTraps, setWalls]);

  const initGame = useCallback((playerClass: PlayerClassValue) => {
    const result = createMapWithRooms();
    setupGameState(result.map, result.rooms, playerClass);
  }, [setupGameState]);

  // 画面遷移ハンドラー
  const handleStartGame = useCallback(() => {
    setScreen(ScreenState.CLASS_SELECT);
  }, []);

  const handleClassSelect = useCallback((playerClass: PlayerClassValue) => {
    setSelectedClass(playerClass);
    setScreen(ScreenState.PROLOGUE);
  }, []);

  const handleSkipPrologue = useCallback(() => {
    initGame(selectedClass);
    setScreen(ScreenState.GAME);
  }, [initGame, selectedClass]);

  const handleRetry = useCallback(() => {
    initGame(selectedClass);
    setScreen(ScreenState.GAME);
  }, [initGame, selectedClass]);

  const handleGameOverRetry = useCallback(() => {
    if (mapRef.current.length === 0) return;
    setupGameState(mapRef.current, roomsRef.current, selectedClass);
    setScreen(ScreenState.GAME);
  }, [setupGameState, selectedClass, mapRef]);

  const handleBackToTitle = useCallback(() => {
    setScreen(ScreenState.TITLE);
    setIsGameOver(false);
  }, []);

  // MVP4: ヘルプ表示トグル
  const handleHelpToggle = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // MVP5: 音声初期化
  const handleEnableAudio = useCallback(async () => {
    const success = await enableAudio();
    if (success) {
      setIsAudioReady(true);
      if (screen === ScreenState.TITLE) {
        playTitleBgm();
      }
    }
  }, [screen]);

  const handleAudioSettingsToggle = useCallback(() => {
    setShowAudioSettings(prev => !prev);
  }, []);

  const handleMasterVolumeChange = useCallback((value: number) => {
    setMasterVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  const handleSeVolumeChange = useCallback((value: number) => {
    setSeVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  const handleBgmVolumeChange = useCallback((value: number) => {
    setBgmVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  const handleToggleMute = useCallback(() => {
    toggleMuteAudio();
    setAudioSettings(getAudioSettings());
  }, []);

  // MVP5: 画面遷移時のBGM切り替え
  useEffect(() => {
    if (!isAudioReady) return;

    switch (screen) {
      case ScreenState.TITLE:
        playTitleBgm();
        break;
      case ScreenState.GAME:
        playGameBgm();
        break;
      case ScreenState.CLEAR:
        stopBgm();
        playClearJingle();
        playGameClearSound();
        break;
      case ScreenState.DYING:
        // 死亡アニメーション中はBGMを停止（死亡効果音はuseGameLoopで再生済み）
        stopBgm();
        break;
      case ScreenState.GAME_OVER:
        playGameOverJingle();
        playGameOverSound();
        break;
      default:
        break;
    }
  }, [screen, isAudioReady]);

  return {
    screen,
    setScreen,
    map,
    setMap,
    mapRef,
    player,
    setPlayer,
    playerRef,
    enemies,
    setEnemies,
    enemiesRef,
    items,
    setItems,
    itemsRef,
    goalPos,
    mapState,
    setMapState,
    debugState,
    setDebugState,
    isGameOver,
    setIsGameOver,
    combatState,
    setCombatState,
    attackEffect,
    setAttackEffect,
    selectedClass,
    traps,
    setTraps,
    trapsRef,
    walls,
    setWalls,
    wallsRef,
    pendingLevelPoints,
    setPendingLevelPoints,
    pendingLevelPointsRef,
    showLevelUpModal,
    setShowLevelUpModal,
    timer,
    setTimer,
    showHelp,
    clearTime,
    setClearTime,
    clearRating,
    setClearRating,
    isNewBest,
    setIsNewBest,
    audioSettings,
    showAudioSettings,
    isAudioReady,
    showKeyRequiredMessage,
    setShowKeyRequiredMessage,
    handleStartGame,
    handleClassSelect,
    handleSkipPrologue,
    handleRetry,
    handleGameOverRetry,
    handleBackToTitle,
    handleHelpToggle,
    handleEnableAudio,
    handleAudioSettingsToggle,
    handleMasterVolumeChange,
    handleSeVolumeChange,
    handleBgmVolumeChange,
    handleToggleMute,
  };
}
