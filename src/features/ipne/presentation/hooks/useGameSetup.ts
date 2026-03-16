/**
 * ゲームセットアップフック
 * マップ生成・プレイヤー初期化・敵スポーン・ギミック配置を管理
 */
import { useCallback, useRef } from 'react';
import {
  createMapWithRooms,
  createPlayer,
  findStartPosition,
  findGoalPosition,
  GameMap,
  Player,
  Enemy,
  Item,
  Room,
  Trap,
  Wall,
  AutoMapState,
  initExploration,
  updateExploration,
  spawnEnemies,
  spawnEnemiesForStage,
  spawnItems,
  placeGimmicks,
  PlayerClassValue,
  Position,
  CombatState,
} from '../../index';
import { createTimer, startTimer, resumeTimer, GameTimer } from '../../application/services/timerService';
import { StageNumber, StageConfig } from '../../types';
import { getStageConfig } from '../../domain/config/stageConfig';
import { SequentialIdGenerator } from '../../infrastructure/id/SequentialIdGenerator';
import { MathRandomProvider } from '../../infrastructure/random/RandomProvider';

const idGenerator = new SequentialIdGenerator();
const randomProvider = new MathRandomProvider();

export interface GameSetupSetters {
  setMap: (map: GameMap) => void;
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  setEnemies: (enemies: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  setItems: (items: Item[] | ((prev: Item[]) => Item[])) => void;
  setTraps: (traps: Trap[] | ((prev: Trap[]) => Trap[])) => void;
  setWalls: (walls: Wall[] | ((prev: Wall[]) => Wall[])) => void;
  setPendingLevelPoints: (points: number | ((prev: number) => number)) => void;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState>>;
  setAttackEffect: React.Dispatch<React.SetStateAction<{ position: Position; until: number } | undefined>>;
  setGoalPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setMapState: React.Dispatch<React.SetStateAction<AutoMapState>>;
  setTimer: React.Dispatch<React.SetStateAction<GameTimer>>;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  setClearTime: React.Dispatch<React.SetStateAction<number>>;
  setIsNewBest: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLevelUpModal: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * ゲームセットアップフック
 */
export function useGameSetup(setters: GameSetupSetters) {
  const roomsRef = useRef<Room[]>([]);

  const setupGameState = useCallback((
    newMap: GameMap,
    rooms: Room[],
    playerClass: PlayerClassValue,
    stageConfig?: StageConfig,
    existingPlayer?: Player,
    existingTimer?: GameTimer,
  ) => {
    // ステージ開始時にIDカウンタをリセット
    idGenerator.reset();

    const startPos = findStartPosition(newMap);
    const goal = findGoalPosition(newMap);
    if (!startPos || !goal) return;

    setters.setMap(newMap);
    setters.setGoalPos(goal);

    // プレイヤー初期化またはステージ間引き継ぎ
    if (existingPlayer) {
      setters.setPlayer({
        ...existingPlayer,
        x: startPos.x, y: startPos.y,
        hasKey: false, isInvincible: false,
        invincibleUntil: 0, attackCooldownUntil: 0,
        slowedUntil: 0, lastRegenAt: 0,
      });
    } else {
      setters.setPlayer(createPlayer(startPos.x, startPos.y, playerClass));
    }

    setters.setIsGameOver(false);
    setters.setPendingLevelPoints(0);
    setters.setShowLevelUpModal(false);
    setters.setCombatState({ lastAttackAt: 0, lastDamageAt: 0 });
    setters.setAttackEffect(undefined);

    // タイマー初期化
    if (existingTimer) {
      setters.setTimer(resumeTimer(existingTimer, Date.now()));
    } else {
      setters.setTimer(startTimer(createTimer()));
    }
    setters.setShowHelp(false);
    setters.setClearTime(0);
    setters.setIsNewBest(false);

    roomsRef.current = rooms;

    // 敵スポーン
    const spawnedEnemies = stageConfig
      ? spawnEnemiesForStage(rooms, startPos, goal, stageConfig, idGenerator, randomProvider)
      : spawnEnemies(rooms, startPos, goal, idGenerator, randomProvider);
    const spawnedItems = spawnItems(rooms, spawnedEnemies, [startPos, goal], idGenerator, randomProvider, goal);
    setters.setEnemies(spawnedEnemies);
    setters.setItems(spawnedItems);

    // ギミック配置
    const gimmickConfig = stageConfig?.gimmicks;
    const gimmickResult = placeGimmicks(rooms, newMap, [startPos, goal], idGenerator, randomProvider, gimmickConfig, startPos, goal);
    setters.setTraps(gimmickResult.traps);
    setters.setWalls(gimmickResult.walls);

    // マップ探索状態初期化
    const exploration = initExploration(newMap[0].length, newMap.length);
    const updatedExploration = updateExploration(exploration, startPos, newMap);
    setters.setMapState({
      exploration: updatedExploration,
      isMapVisible: true,
      isFullScreen: false,
    });

  }, [setters]);

  const initStage = useCallback((
    stage: StageNumber,
    playerClass: PlayerClassValue,
    existingPlayer?: Player,
    existingTimer?: GameTimer,
  ) => {
    const stageConfig = getStageConfig(stage);
    const result = createMapWithRooms(stageConfig.maze, randomProvider);
    setupGameState(result.map, result.rooms, playerClass, stageConfig, existingPlayer, existingTimer);
  }, [setupGameState]);

  return { setupGameState, initStage, roomsRef };
}
