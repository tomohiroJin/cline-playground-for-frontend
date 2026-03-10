/**
 * ゲームループフック
 * 敵AI・接触・アイテム取得の更新ループと効果ディスパッチを管理
 */
import { useEffect, useCallback } from 'react';
import {
  GameMap,
  Player,
  Enemy,
  Item,
  Trap,
  Wall,
  ScreenState,
  ScreenStateValue,
  AutoMapState,
  CombatState,
  MAX_LEVEL,
} from '../../index';
import { tickGameState, TickDisplayEffect, TickSoundEffect, GameTickEffect } from '../../application';
import {
  playPlayerDamageSound,
  playItemPickupSound,
  playHealSound,
  playTrapTriggeredSound,
  playLevelUpSound,
  playDodgeSound,
  playKeyPickupSound,
  playTeleportSound,
  playDyingSound,
} from '../../audio';
import { EffectType, FloatingTextManager, FloatingTextType } from '../effects';
import { EnemyType } from '../../index';
import type { EffectEvent } from '../screens/Game';

/**
 * ゲームループで使用するRef群の型定義
 */
interface GameStateRefs {
  mapRef: React.MutableRefObject<GameMap>;
  playerRef: React.MutableRefObject<Player>;
  enemiesRef: React.MutableRefObject<Enemy[]>;
  itemsRef: React.MutableRefObject<Item[]>;
  trapsRef: React.MutableRefObject<Trap[]>;
  wallsRef: React.MutableRefObject<Wall[]>;
  pendingLevelPointsRef: React.MutableRefObject<number>;
}

/**
 * ゲームループの状態更新関数群の型定義
 */
interface GameStateSetters {
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
 * 200msごとに敵AI・接触・アイテム取得を更新する
 */
export function useGameLoop(
  screen: ScreenStateValue,
  refs: GameStateRefs,
  setters: GameStateSetters,
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>,
  stageMaxLevel?: number,
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>,
) {
  const {
    mapRef,
    playerRef,
    enemiesRef,
    itemsRef,
    trapsRef,
    wallsRef,
    pendingLevelPointsRef,
  } = refs;

  const {
    setPlayer,
    setEnemies,
    setItems,
    setTraps,
    setPendingLevelPoints,
    setCombatState,
    setMapState,
    setIsGameOver,
    setScreen,
  } = setters;

  const dispatchTickEffects = useCallback((effects: GameTickEffect[]) => {
    for (const effect of effects) {
      if (effect.kind === 'sound') {
        switch (effect.type) {
          case TickSoundEffect.PLAYER_DAMAGE: {
            const now = Date.now();
            setCombatState(prev => ({ ...prev, lastDamageAt: now }));
            playPlayerDamageSound();
            // プレイヤー被弾フローティングテキスト
            if (floatingTextManagerRef && effect.damage) {
              floatingTextManagerRef.current.addText(
                `${effect.damage}`,
                playerRef.current.x,
                playerRef.current.y,
                FloatingTextType.PLAYER_DAMAGE,
                now
              );
            }
            // 敵攻撃エフェクト（敵タイプに応じたバリエーション）
            if (effectQueueRef) {
              const enemyType = effect.enemyType;
              const variant = (
                enemyType === EnemyType.BOSS ||
                enemyType === EnemyType.MINI_BOSS ||
                enemyType === EnemyType.MEGA_BOSS
              ) ? 'boss' : (
                enemyType === EnemyType.RANGED ? 'ranged' : 'melee'
              );
              effectQueueRef.current.push({
                type: EffectType.ENEMY_ATTACK,
                x: playerRef.current.x,
                y: playerRef.current.y,
                variant,
              } as EffectEvent);
            }
            break;
          }
          case TickSoundEffect.ITEM_PICKUP:
            playItemPickupSound();
            // アイテム取得エフェクト（アイテム種別対応）
            if (effectQueueRef) {
              effectQueueRef.current.push({
                type: EffectType.ITEM_PICKUP,
                x: playerRef.current.x,
                y: playerRef.current.y,
                itemType: effect.itemType,
              });
            }
            break;
          case TickSoundEffect.HEAL:
            playHealSound();
            // 回復フローティングテキスト + アイテム取得エフェクト
            if (floatingTextManagerRef) {
              floatingTextManagerRef.current.addText(
                '+HP',
                playerRef.current.x,
                playerRef.current.y,
                FloatingTextType.HEAL,
                Date.now()
              );
            }
            if (effectQueueRef) {
              effectQueueRef.current.push({
                type: EffectType.ITEM_PICKUP,
                x: playerRef.current.x,
                y: playerRef.current.y,
                itemType: effect.itemType,
              });
            }
            break;
          case TickSoundEffect.TRAP_TRIGGERED:
            playTrapTriggeredSound();
            // 罠発動エフェクト（ダメージ罠・減速罠）
            if (effectQueueRef) {
              effectQueueRef.current.push({
                type: EffectType.TRAP_DAMAGE,
                x: playerRef.current.x,
                y: playerRef.current.y,
              });
            }
            break;
          case TickSoundEffect.LEVEL_UP:
            playLevelUpSound();
            // レベルアップエフェクト
            if (effectQueueRef) {
              effectQueueRef.current.push({
                type: EffectType.LEVEL_UP,
                x: playerRef.current.x,
                y: playerRef.current.y,
              });
            }
            break;
          case TickSoundEffect.DODGE:
            playDodgeSound();
            break;
          case TickSoundEffect.KEY_PICKUP:
            playKeyPickupSound();
            // 鍵取得フローティングテキスト
            if (floatingTextManagerRef) {
              floatingTextManagerRef.current.addText(
                'KEY GET!',
                playerRef.current.x,
                playerRef.current.y,
                FloatingTextType.INFO,
                Date.now()
              );
            }
            break;
          case TickSoundEffect.TELEPORT:
            playTeleportSound();
            // テレポート罠エフェクト
            if (effectQueueRef) {
              effectQueueRef.current.push({
                type: EffectType.TRAP_TELEPORT,
                x: playerRef.current.x,
                y: playerRef.current.y,
              });
            }
            break;
          case TickSoundEffect.DYING:
            playDyingSound();
            break;
          default:
            break;
        }
      } else if (effect.kind === 'display') {
        switch (effect.type) {
          case TickDisplayEffect.MAP_REVEALED: {
            const fullExploration = mapRef.current.map(row => row.map(() => 1 as const));
            setMapState(prev => ({ ...prev, exploration: fullExploration }));
            break;
          }
          case TickDisplayEffect.GAME_OVER:
            // 死亡アニメーション状態に遷移（1.5秒後にゲームオーバー画面へ）
            setScreen(ScreenState.DYING);
            setTimeout(() => {
              setIsGameOver(true);
              setScreen(ScreenState.GAME_OVER);
            }, 1500);
            break;
          default:
            break;
        }
      }
    }
  }, [mapRef, playerRef, setCombatState, setIsGameOver, setMapState, setScreen, effectQueueRef, floatingTextManagerRef]);

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
    screen,
    dispatchTickEffects,
    enemiesRef,
    itemsRef,
    mapRef,
    pendingLevelPointsRef,
    playerRef,
    setEnemies,
    setItems,
    setPendingLevelPoints,
    setPlayer,
    setTraps,
    trapsRef,
    wallsRef,
    stageMaxLevel,
  ]);
}
