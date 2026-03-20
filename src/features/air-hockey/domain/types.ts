/**
 * ドメイン型定義
 * - core/types.ts および関連モジュールからドメインに属する型を re-export
 * - ドメイン層・インフラ層は core/ を直接参照せず、この re-export 経由で型を利用する
 */
export type {
  // 基本型
  Vector,
  Velocity,
  Entity,
  // エンティティ関連
  Mallet,
  Puck,
  ItemType,
  Item,
  // エフェクト
  EffectState,
  GameEffects,
  GoalEffect,
  FeverState,
  Particle,
  HitStopState,
  // ゲーム状態
  GameState,
  ComboState,
  MatchStats,
  GamePhase,
  Difficulty,
  // フィールド
  FieldConfig,
  Obstacle,
  ObstacleState,
  // 図鑑
  DexProgress,
} from '../core/types';

// ストレージ関連型（各モジュールから re-export）
export type { StoryProgress } from '../core/story';
export type { UnlockState } from '../core/unlock';
export type { AudioSettings } from '../core/audio-settings';
export type { DailyChallengeResult } from '../core/daily-challenge';
