/**
 * Item ドメインモデル
 * アイテムのピックアップ処理を純粋関数として提供
 */
import { GAME_BALANCE } from '../constants';
import { calculateCombo, calculateKeyScore } from '../services/scoring';
import type { GameEvent } from '../../application/game-events';
import { createSoundEvent } from '../../application/game-events';

const { TRAP_TIME_PENALTY, SPEED_BOOST_DURATION, MESSAGE_DURATION } = GAME_BALANCE.timing;
const { HEAL_FULL_BONUS } = GAME_BALANCE.scoring;
const { MAP_REVEAL_RADIUS } = GAME_BALANCE.items;

/** アイテムピックアップのコンテキスト（必要な GameState の部分） */
export interface ItemPickupContext {
  readonly lives: number;
  readonly maxLives: number;
  readonly combo: number;
  readonly gameTime: number;
  readonly lastKeyTime: number;
  readonly collectedKeys: number;
  readonly requiredKeys: number;
}

/** アイテムピックアップの結果 */
export interface ItemPickupResult {
  /** 変更するステートの差分 */
  readonly stateChanges: {
    readonly lives?: number;
    readonly score?: number;
    readonly combo?: number;
    readonly lastKeyTime?: number;
    readonly keys?: number;
    readonly time?: number;
    readonly speedBoost?: number;
  };
  /** 発生するイベント */
  readonly events: readonly GameEvent[];
  /** 表示するメッセージ */
  readonly message: string;
  /** 地図公開の中心座標（map アイテムのみ） */
  readonly mapRevealCenter?: { readonly x: number; readonly y: number };
}

/** アイテムのピックアップを処理する（純粋関数） */
export const processItemPickup = (
  itemType: string,
  itemX: number,
  itemY: number,
  context: ItemPickupContext
): ItemPickupResult => {
  switch (itemType) {
    case 'key': {
      const newCombo = calculateCombo(context.combo, context.gameTime, context.lastKeyTime);
      const bonus = calculateKeyScore(newCombo);
      const newKeys = context.collectedKeys + 1;
      return {
        stateChanges: {
          combo: newCombo,
          lastKeyTime: context.gameTime,
          keys: newKeys,
          score: bonus,
        },
        events: [createSoundEvent('key', 0.45)],
        message: `🔑 鍵を入手！ +${bonus}pt (${newKeys}/${context.requiredKeys})`,
      };
    }
    case 'trap':
      return {
        stateChanges: {
          time: -TRAP_TIME_PENALTY,
          combo: 0,
        },
        events: [createSoundEvent('trap', 0.45)],
        message: '📦 罠だ！時間 -12秒！',
      };
    case 'heal': {
      if (context.lives < context.maxLives) {
        return {
          stateChanges: { lives: context.lives + 1 },
          events: [createSoundEvent('heal', 0.4)],
          message: '💊 回復薬！ ライフ+1',
        };
      }
      return {
        stateChanges: { score: HEAL_FULL_BONUS },
        events: [createSoundEvent('heal', 0.4)],
        message: `💊 体力満タン！ +${HEAL_FULL_BONUS}pt`,
      };
    }
    case 'speed':
      return {
        stateChanges: { speedBoost: SPEED_BOOST_DURATION },
        events: [createSoundEvent('speed', 0.4)],
        message: '⚡ 加速！ 10秒間スピードアップ！',
      };
    case 'map':
      return {
        stateChanges: {},
        events: [createSoundEvent('mapReveal', 0.4)],
        message: '🗺️ 地図を発見！ 周囲のマップが公開された！',
        mapRevealCenter: { x: itemX, y: itemY },
      };
    default:
      return {
        stateChanges: {},
        events: [],
        message: '',
      };
  }
};

/** 地図の公開範囲を取得する */
export const getMapRevealRadius = (): number => MAP_REVEAL_RADIUS;

/** メッセージの表示時間を取得する */
export const getMessageDuration = (): number => MESSAGE_DURATION;
