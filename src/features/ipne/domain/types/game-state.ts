/**
 * ゲーム状態関連の型定義
 * 画面状態、ゲーム全体の状態、戦闘状態、評価、記録
 */

import type { GameMap } from './world';
import { PlayerClass, type Player, type PlayerClassValue } from './player';
import type { Enemy } from './enemy';
import type { Trap, Wall } from './gimmicks';
import type { Item } from './items';

/** ゲーム画面の状態 */
export const ScreenState = {
  TITLE: 'title',
  CLASS_SELECT: 'class_select',
  PROLOGUE: 'prologue',
  GAME: 'game',
  DYING: 'dying',
  GAME_OVER: 'game_over',
  // 5ステージ制で追加
  STAGE_CLEAR: 'stage_clear',
  STAGE_STORY: 'stage_story',
  STAGE_REWARD: 'stage_reward',
  FINAL_CLEAR: 'final_clear',
} as const;

export type ScreenStateValue = (typeof ScreenState)[keyof typeof ScreenState];

/** 戦闘の一時状態 */
export interface CombatState {
  lastAttackAt: number;
  lastDamageAt: number;
}

/** ゲーム全体の状態 */
export interface GameState {
  map: GameMap;
  player: Player;
  screen: ScreenStateValue;
  isCleared: boolean;
  enemies: Enemy[];
  items: Item[];
  // MVP3追加
  traps: Trap[];
  walls: Wall[];
  isLevelUpPending: boolean;
}

/** 評価ランク */
export const Rating = {
  S: 's',
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
} as const;

export type RatingValue = (typeof Rating)[keyof typeof Rating];

/** エピローグテキスト */
export interface EpilogueText {
  title: string;
  text: string;
  /** 複数段落の詳細テキスト。設定時は段階的にフェードイン表示する */
  paragraphs?: string[];
}

/** ゲーム記録 */
export interface GameRecord {
  time: number;
  rating: RatingValue;
  playerClass: PlayerClassValue;
  date: string;
  /** 5ステージ制で追加（後方互換性維持） */
  stagesCleared?: number;
}

/** ベスト記録（職業別） */
export interface BestRecords {
  [PlayerClass.WARRIOR]?: GameRecord;
  [PlayerClass.THIEF]?: GameRecord;
}
