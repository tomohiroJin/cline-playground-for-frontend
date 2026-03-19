/**
 * ドメイン型定義
 * - core/types.ts からドメインに属する型を re-export
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
} from '../core/types';
