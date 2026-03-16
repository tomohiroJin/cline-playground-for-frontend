/**
 * ステージ関連の型定義
 * ステージ設定、ギミック配置、報酬、ストーリー
 */

import type { MazeConfig } from './world';
import type { PlayerClassValue, PlayerStats } from './player';

/** ステージ番号（1〜5） */
export type StageNumber = 1 | 2 | 3 | 4 | 5;

/** 戦略的配置パターンの制限数 */
export interface StrategicPatternLimits {
  shortcutBlock: number;
  trickWall: number;
  secretPassage: number;
  corridorBlock: number;
}

/** ギミック配置設定 */
export interface GimmickPlacementConfig {
  trapCount: number;
  trapRatio: {
    damage: number;
    slow: number;
    teleport: number;
  };
  wallCount: number;
  wallRatio: {
    breakable: number;
    passable: number;
    invisible: number;
  };
  patternLimits?: StrategicPatternLimits;
}

/** ステージ設定 */
export interface StageConfig {
  /** ステージ番号 */
  stage: StageNumber;
  /** ステージ名（表示用） */
  name: string;
  /** 迷路設定 */
  maze: MazeConfig;
  /** 敵配置数 */
  enemies: {
    patrol: number;
    charge: number;
    ranged: number;
    specimen: number;
    miniBoss: number;
  };
  /** 敵スケーリング倍率 */
  scaling: {
    hp: number;
    damage: number;
    speed: number;
  };
  /** ギミック配置 */
  gimmicks: GimmickPlacementConfig;
  /** このステージでのレベル上限 */
  maxLevel: number;
  /** ボスタイプ（通常 or メガ） */
  bossType: 'boss' | 'mega_boss';
}

/** ステージ報酬の種類 */
export type StageRewardType =
  | 'max_hp'
  | 'attack_power'
  | 'attack_range'
  | 'move_speed'
  | 'attack_speed'
  | 'heal_bonus';

/** ステージ報酬履歴 */
export interface StageRewardHistory {
  stage: StageNumber;
  reward: StageRewardType;
}

/** ステージ間で引き継ぐプレイヤーデータ */
export interface StageCarryOver {
  level: number;
  killCount: number;
  hp: number;
  maxHp: number;
  hasKey: false;
  stats: PlayerStats;
  playerClass: PlayerClassValue;
  stageRewards: StageRewardHistory[];
}

/** マルチシーン用のスライド */
export interface StorySceneSlide {
  /** スライド固有のタイトル（省略時はメインタイトルを使用） */
  title?: string;
  /** テキスト行 */
  lines: string[];
  /** 画像キー（画像レジストリ参照） */
  imageKey?: string;
}

/** ストーリーシーン */
export interface StoryScene {
  id: string;
  title: string;
  lines: string[];
  /** 将来の画像挿入用。未設定時は undefined */
  imageKey?: string;
  /** マルチシーン対応。設定時は slides を優先して表示する */
  slides?: StorySceneSlide[];
}
