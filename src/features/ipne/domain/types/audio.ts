/**
 * 音声関連の型定義
 * 効果音、BGM、音声設定
 */

/** 効果音の種類 */
export const SoundEffectType = {
  // 既存 10 種
  PLAYER_DAMAGE: 'player_damage',
  ENEMY_KILL: 'enemy_kill',
  BOSS_KILL: 'boss_kill',
  GAME_CLEAR: 'game_clear',
  GAME_OVER: 'game_over',
  LEVEL_UP: 'level_up',
  ATTACK_HIT: 'attack_hit',
  ITEM_PICKUP: 'item_pickup',
  HEAL: 'heal',
  TRAP_TRIGGERED: 'trap_triggered',
  // 新規 12 種
  MOVE_STEP: 'move_step',
  WALL_BUMP: 'wall_bump',
  ATTACK_SWING: 'attack_swing',
  ATTACK_MISS: 'attack_miss',
  ENEMY_DAMAGE: 'enemy_damage',
  DODGE: 'dodge',
  KEY_PICKUP: 'key_pickup',
  DOOR_OPEN: 'door_open',
  SPEED_BOOST: 'speed_boost',
  WALL_BREAK: 'wall_break',
  TELEPORT: 'teleport',
  DYING: 'dying',
} as const;

export type SoundEffectTypeValue = (typeof SoundEffectType)[keyof typeof SoundEffectType];

/** BGMの種類 */
export const BgmType = {
  TITLE: 'title',
  GAME: 'game',
  GAME_STAGE1: 'game_stage1',
  GAME_STAGE2: 'game_stage2',
  GAME_STAGE3: 'game_stage3',
  GAME_STAGE4: 'game_stage4',
  GAME_STAGE5: 'game_stage5',
  BOSS: 'boss',
  CLEAR: 'clear',
  GAME_OVER: 'game_over',
} as const;

export type BgmTypeValue = (typeof BgmType)[keyof typeof BgmType];

/** 音声設定 */
export interface AudioSettings {
  masterVolume: number;
  seVolume: number;
  bgmVolume: number;
  isMuted: boolean;
}

/** 音声設定のデフォルト値 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  seVolume: 0.8,
  bgmVolume: 0.5,
  isMuted: false,
};

/** 効果音設定 */
export interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  gain: number;
  sweep?: number;
}

/** メロディノート（周波数, 長さ） */
export type MelodyNote = readonly [number, number];

/** 画像エントリ */
export interface StoryImageEntry {
  /** 画像ソース (URL or data URI) */
  src: string;
  /** alt テキスト */
  alt: string;
  /** 表示幅 (px) */
  width: number;
  /** 表示高さ (px) */
  height: number;
}
