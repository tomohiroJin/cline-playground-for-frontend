/**
 * ゲームループフック
 * 200msごとに敵AI・接触・アイテム取得を更新する
 */
import { useEffect, useMemo } from 'react';
import {
  Player,
  Enemy,
  Item,
  Trap,
  Wall,
  GameMap,
  ScreenState,
  ScreenStateValue,
  AutoMapState,
  CombatState,
  MAX_LEVEL,
} from '../../index';
import { tickGameState } from '../../application';
import { MathRandomProvider } from '../../infrastructure/random/RandomProvider';
import { FloatingTextManager } from '../effects';
import type { EffectEvent } from '../screens/Game';
import { useEffectDispatcher } from './useEffectDispatcher';

/** ゲームループで使用するRef群 */
interface GameLoopRefs {
  mapRef: React.MutableRefObject<GameMap>;
  playerRef: React.MutableRefObject<Player>;
  enemiesRef: React.MutableRefObject<Enemy[]>;
  itemsRef: React.MutableRefObject<Item[]>;
  trapsRef: React.MutableRefObject<Trap[]>;
  wallsRef: React.MutableRefObject<Wall[]>;
  pendingLevelPointsRef: React.MutableRefObject<number>;
}

/** ゲームループの状態更新関数群 */
interface GameLoopSetters {
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  setEnemies: (enemies: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  setItems: (items: Item[] | ((prev: Item[]) => Item[])) => void;
  setTraps: (traps: Trap[] | ((prev: Trap[]) => Trap[])) => void;
  setPendingLevelPoints: (points: number | ((prev: number) => number)) => void;
  setCombatState: React.Dispatch<React.SetStateAction<CombatState>>;
  setMapState: React.Dispatch<React.SetStateAction<AutoMapState>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setScreen: React.Dispatch<React.SetStateAction<ScreenStateValue>>;
}

/**
 * ゲームループフック
 */
export function useGameLoop(
  screen: ScreenStateValue,
  refs: GameLoopRefs,
  setters: GameLoopSetters,
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>,
  stageMaxLevel?: number,
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>,
) {
  const {
    mapRef, playerRef, enemiesRef, itemsRef,
    trapsRef, wallsRef, pendingLevelPointsRef,
  } = refs;

  const {
    setPlayer, setEnemies, setItems, setTraps,
    setPendingLevelPoints, setCombatState, setMapState,
    setIsGameOver, setScreen,
  } = setters;

  const randomProvider = useMemo(() => new MathRandomProvider(), []);

  const { dispatchTickEffects } = useEffectDispatcher(
    { mapRef, playerRef, effectQueueRef, floatingTextManagerRef },
    { setCombatState, setMapState, setIsGameOver, setScreen },
  );

  useEffect(() => {
    if (screen !== ScreenState.GAME) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const tickResult = tickGameState({
        map: mapRef.current,
        player: playerRef.current,
        enemies: enemiesRef.current,
        items: itemsRef.current,
        traps: trapsRef.current,
        walls: wallsRef.current,
        pendingLevelPoints: pendingLevelPointsRef.current,
        currentTime,
        maxLevel: stageMaxLevel ?? MAX_LEVEL,
        random: randomProvider,
      });

      dispatchTickEffects(tickResult.effects);
      setPlayer(tickResult.player);
      setEnemies(tickResult.enemies);
      setItems(tickResult.items);
      setTraps(tickResult.traps);
      setPendingLevelPoints(tickResult.pendingLevelPoints);
    }, 200);

    return () => clearInterval(interval);
  }, [
    screen, dispatchTickEffects,
    enemiesRef, itemsRef, mapRef, pendingLevelPointsRef,
    playerRef, setEnemies, setItems, setPendingLevelPoints,
    setPlayer, setTraps, trapsRef, wallsRef, stageMaxLevel,
    randomProvider,
  ]);
}
