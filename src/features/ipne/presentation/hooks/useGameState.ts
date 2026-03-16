/**
 * ゲーム状態管理 Facade フック
 * 各サブフックを統合して一つのインターフェースとして提供する
 */
import { useState, useCallback } from 'react';
import {
  createPlayer,
  ScreenState,
  GameMap,
  Player,
  Enemy,
  Item,
  CombatState,
  ScreenStateValue,
  AutoMapState,
  Position,
  DebugState,
  initDebugState,
  PlayerClass,
  PlayerClassValue,
  Trap,
  Wall,
} from '../../index';
import { createTimer, GameTimer } from '../../application/services/timerService';
import { RatingValue, AudioSettings, StageNumber, StageRewardType, StageRewardHistory, StageConfig } from '../../types';
import { getStageConfig } from '../../domain/config/stageConfig';
import { useSyncedState } from '../state/useSyncedState';
import { useGameSetup } from './useGameSetup';
import { useScreenTransition } from './useScreenTransition';
import { useStageManagement } from './useStageManagement';
import { useGameAudio } from './useGameAudio';

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
  timer: GameTimer;
  setTimer: React.Dispatch<React.SetStateAction<GameTimer>>;
  showHelp: boolean;
  clearTime: number;
  setClearTime: React.Dispatch<React.SetStateAction<number>>;
  clearRating: RatingValue;
  setClearRating: React.Dispatch<React.SetStateAction<RatingValue>>;
  isNewBest: boolean;
  setIsNewBest: React.Dispatch<React.SetStateAction<boolean>>;
  audioSettings: AudioSettings;
  showAudioSettings: boolean;
  isAudioReady: boolean;
  showKeyRequiredMessage: boolean;
  setShowKeyRequiredMessage: React.Dispatch<React.SetStateAction<boolean>>;
  currentStage: StageNumber;
  stageRewards: StageRewardHistory[];
  currentStageConfig: StageConfig;
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
  handleStageClearNext: () => void;
  handleStageStoryNext: () => void;
  handleRewardSelect: (rewardType: StageRewardType) => void;
  canChooseStageReward: (rewardType: StageRewardType) => boolean;
}

/**
 * ゲーム状態管理 Facade フック
 */
export function useGameState(): GameState {
  // 基本状態
  const [screen, setScreen] = useState<ScreenStateValue>(ScreenState.TITLE);
  const [map, setMap, mapRef] = useSyncedState<GameMap>([]);
  const [player, setPlayer, playerRef] = useSyncedState<Player>(createPlayer(0, 0));
  const [enemies, setEnemies, enemiesRef] = useSyncedState<Enemy[]>([]);
  const [items, setItems, itemsRef] = useSyncedState<Item[]>([]);
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapState, setMapState] = useState<AutoMapState>({
    exploration: [], isMapVisible: true, isFullScreen: false,
  });
  const [debugState, setDebugState] = useState<DebugState>(() => initDebugState());
  const [isGameOver, setIsGameOver] = useState(false);
  const [combatState, setCombatState] = useState<CombatState>({ lastAttackAt: 0, lastDamageAt: 0 });
  const [attackEffect, setAttackEffect] = useState<{ position: Position; until: number } | undefined>(undefined);
  const [selectedClass, setSelectedClass] = useState<PlayerClassValue>(PlayerClass.WARRIOR);
  const [traps, setTraps, trapsRef] = useSyncedState<Trap[]>([]);
  const [walls, setWalls, wallsRef] = useSyncedState<Wall[]>([]);
  const [pendingLevelPoints, setPendingLevelPoints, pendingLevelPointsRef] = useSyncedState(0);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [timer, setTimer] = useState<GameTimer>(() => createTimer());
  const [showHelp, setShowHelp] = useState(false);
  const [clearTime, setClearTime] = useState(0);
  const [clearRating, setClearRating] = useState<RatingValue>('d');
  const [isNewBest, setIsNewBest] = useState(false);
  const [showKeyRequiredMessage, setShowKeyRequiredMessage] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageNumber>(1);
  const [stageRewards, setStageRewards] = useState<StageRewardHistory[]>([]);

  const currentStageConfig = getStageConfig(currentStage);

  // サブフック: ゲームセットアップ
  const { initStage } = useGameSetup({
    setMap, setPlayer, setEnemies, setItems, setTraps, setWalls,
    setPendingLevelPoints, setIsGameOver, setCombatState, setAttackEffect,
    setGoalPos, setMapState, setTimer, setShowHelp: setShowHelp,
    setClearTime, setIsNewBest, setShowLevelUpModal,
  });

  // ゲーム初期化
  const initGame = useCallback((playerClass: PlayerClassValue) => {
    setCurrentStage(1);
    setStageRewards([]);
    initStage(1, playerClass);
  }, [initStage]);

  // サブフック: 画面遷移
  const screenTransition = useScreenTransition({
    setScreen, setSelectedClass, setIsGameOver,
    setCurrentStage, setStageRewards, selectedClass, initGame,
  });

  // サブフック: ステージ管理
  const stageManagement = useStageManagement({
    currentStage, setCurrentStage, setStageRewards,
    setScreen, playerRef, setPlayer, selectedClass, timer, initStage,
  });

  // サブフック: 音声管理
  const audio = useGameAudio(screen, currentStage);

  // ヘルプトグル
  const handleHelpToggle = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  return {
    screen, setScreen,
    map, setMap, mapRef,
    player, setPlayer, playerRef,
    enemies, setEnemies, enemiesRef,
    items, setItems, itemsRef,
    goalPos, mapState, setMapState,
    debugState, setDebugState,
    isGameOver, setIsGameOver,
    combatState, setCombatState,
    attackEffect, setAttackEffect,
    selectedClass,
    traps, setTraps, trapsRef,
    walls, setWalls, wallsRef,
    pendingLevelPoints, setPendingLevelPoints, pendingLevelPointsRef,
    showLevelUpModal, setShowLevelUpModal,
    timer, setTimer,
    showHelp, clearTime, setClearTime,
    clearRating, setClearRating,
    isNewBest, setIsNewBest,
    audioSettings: audio.audioSettings,
    showAudioSettings: audio.showAudioSettings,
    isAudioReady: audio.isAudioReady,
    showKeyRequiredMessage, setShowKeyRequiredMessage,
    currentStage, stageRewards, currentStageConfig,
    // 画面遷移ハンドラー
    handleStartGame: screenTransition.handleStartGame,
    handleClassSelect: screenTransition.handleClassSelect,
    handleSkipPrologue: screenTransition.handleSkipPrologue,
    handleRetry: screenTransition.handleRetry,
    handleGameOverRetry: screenTransition.handleGameOverRetry,
    handleBackToTitle: screenTransition.handleBackToTitle,
    handleHelpToggle,
    // 音声ハンドラー
    handleEnableAudio: audio.handleEnableAudio,
    handleAudioSettingsToggle: audio.handleAudioSettingsToggle,
    handleMasterVolumeChange: audio.handleMasterVolumeChange,
    handleSeVolumeChange: audio.handleSeVolumeChange,
    handleBgmVolumeChange: audio.handleBgmVolumeChange,
    handleToggleMute: audio.handleToggleMute,
    // ステージハンドラー
    handleStageClearNext: stageManagement.handleStageClearNext,
    handleStageStoryNext: stageManagement.handleStageStoryNext,
    handleRewardSelect: stageManagement.handleRewardSelect,
    canChooseStageReward: stageManagement.canChooseStageReward,
  };
}
