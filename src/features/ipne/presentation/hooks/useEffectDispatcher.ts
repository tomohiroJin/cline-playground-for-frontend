/**
 * エフェクトディスパッチフック
 * ゲームティックのエフェクトを音声・表示・フローティングテキストに変換する
 */
import { useCallback } from 'react';
import {
  GameMap,
  Player,
  ScreenState,
  ScreenStateValue,
  AutoMapState,
  CombatState,
} from '../../index';
import { TickDisplayEffect, TickSoundEffect, GameTickEffect } from '../../application';
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

/** エフェクトディスパッチに必要なRef群 */
export interface EffectDispatcherRefs {
  mapRef: React.MutableRefObject<GameMap>;
  playerRef: React.MutableRefObject<Player>;
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>;
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>;
}

/** エフェクトディスパッチに必要なSetter群 */
export interface EffectDispatcherSetters {
  setCombatState: React.Dispatch<React.SetStateAction<CombatState>>;
  setMapState: React.Dispatch<React.SetStateAction<AutoMapState>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setScreen: React.Dispatch<React.SetStateAction<ScreenStateValue>>;
}

/**
 * ゲームティックエフェクトをディスパッチするフック
 */
export function useEffectDispatcher(
  refs: EffectDispatcherRefs,
  setters: EffectDispatcherSetters,
) {
  const { mapRef, playerRef, effectQueueRef, floatingTextManagerRef } = refs;
  const { setCombatState, setMapState, setIsGameOver, setScreen } = setters;

  const dispatchTickEffects = useCallback((effects: GameTickEffect[]) => {
    for (const effect of effects) {
      if (effect.kind === 'sound') {
        dispatchSoundEffect(
          effect, playerRef, setCombatState,
          floatingTextManagerRef, effectQueueRef,
        );
      } else if (effect.kind === 'display') {
        dispatchDisplayEffect(
          effect, mapRef, setMapState, setIsGameOver, setScreen,
        );
      }
    }
  }, [mapRef, playerRef, setCombatState, setIsGameOver, setMapState, setScreen, effectQueueRef, floatingTextManagerRef]);

  return { dispatchTickEffects };
}

/** 音声エフェクトのディスパッチ */
function dispatchSoundEffect(
  effect: GameTickEffect & { kind: 'sound' },
  playerRef: React.MutableRefObject<Player>,
  setCombatState: React.Dispatch<React.SetStateAction<CombatState>>,
  floatingTextManagerRef?: React.MutableRefObject<FloatingTextManager>,
  effectQueueRef?: React.MutableRefObject<EffectEvent[]>,
) {
  switch (effect.type) {
    case TickSoundEffect.PLAYER_DAMAGE: {
      const now = Date.now();
      setCombatState(prev => ({ ...prev, lastDamageAt: now }));
      playPlayerDamageSound();
      if (floatingTextManagerRef && effect.damage) {
        floatingTextManagerRef.current.addText(
          `${effect.damage}`,
          playerRef.current.x,
          playerRef.current.y,
          FloatingTextType.PLAYER_DAMAGE,
          now,
        );
      }
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
      if (floatingTextManagerRef) {
        floatingTextManagerRef.current.addText(
          '+HP',
          playerRef.current.x,
          playerRef.current.y,
          FloatingTextType.HEAL,
          Date.now(),
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
      if (floatingTextManagerRef) {
        floatingTextManagerRef.current.addText(
          'KEY GET!',
          playerRef.current.x,
          playerRef.current.y,
          FloatingTextType.INFO,
          Date.now(),
        );
      }
      break;
    case TickSoundEffect.TELEPORT:
      playTeleportSound();
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
}

/** 表示エフェクトのディスパッチ */
function dispatchDisplayEffect(
  effect: GameTickEffect & { kind: 'display' },
  mapRef: React.MutableRefObject<GameMap>,
  setMapState: React.Dispatch<React.SetStateAction<AutoMapState>>,
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>,
  setScreen: React.Dispatch<React.SetStateAction<ScreenStateValue>>,
) {
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
