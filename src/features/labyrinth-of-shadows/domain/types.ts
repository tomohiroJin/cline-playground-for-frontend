/**
 * ドメイン層の型定義
 * ゲームのコアロジックで使用する型を集約
 */

/** 座標を表す値オブジェクト */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** 難易度 */
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

/** 敵タイプ */
export type EnemyType = 'wanderer' | 'chaser' | 'teleporter';

/** アイテムタイプ */
export type ItemType = 'key' | 'trap' | 'heal' | 'speed' | 'map';

/** サウンド名 */
export type SoundName =
  | 'footstep'
  | 'sprint'
  | 'enemy'
  | 'key'
  | 'trap'
  | 'door'
  | 'hurt'
  | 'heartbeat'
  | 'heal'
  | 'speed'
  | 'mapReveal'
  | 'teleport';

/** ゲームイベント（副作用のトリガー） */
export type GameEvent =
  | { readonly type: 'SOUND_PLAY'; readonly sound: SoundName; readonly volume: number }
  | { readonly type: 'SOUND_SPATIAL'; readonly sound: SoundName; readonly volume: number; readonly pan: number }
  | { readonly type: 'MESSAGE'; readonly text: string; readonly duration: number }
  | { readonly type: 'GAME_END'; readonly reason: 'victory' | 'gameover' | 'timeout' };
