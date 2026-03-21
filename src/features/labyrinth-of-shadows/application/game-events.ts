/**
 * ゲームイベント型定義
 * ドメイン層とインフラ層（AudioService等）を分離するためのイベント
 */
import type { SoundName } from '../domain/types';

/** ゲームイベント（副作用のトリガー） */
export type GameEvent =
  | { readonly type: 'SOUND_PLAY'; readonly sound: SoundName; readonly volume: number }
  | { readonly type: 'SOUND_SPATIAL'; readonly sound: SoundName; readonly volume: number; readonly pan: number }
  | { readonly type: 'BGM_UPDATE'; readonly danger: number }
  | { readonly type: 'MESSAGE'; readonly text: string }
  | { readonly type: 'GAME_END'; readonly reason: 'victory' | 'gameover' | 'timeout' };

/** イベントを生成するヘルパー関数 */
export const createSoundEvent = (sound: SoundName, volume: number): GameEvent => ({
  type: 'SOUND_PLAY',
  sound,
  volume,
});

export const createSpatialSoundEvent = (
  sound: SoundName,
  volume: number,
  pan: number
): GameEvent => ({
  type: 'SOUND_SPATIAL',
  sound,
  volume,
  pan,
});

export const createMessageEvent = (text: string): GameEvent => ({
  type: 'MESSAGE',
  text,
});

export const createGameEndEvent = (reason: 'victory' | 'gameover' | 'timeout'): GameEvent => ({
  type: 'GAME_END',
  reason,
});
