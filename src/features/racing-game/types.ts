// Racing Game 型定義
// 移行期間中: 新モジュール domain/*/types.ts から re-export

// 共通型
export type { Point, Checkpoint } from './domain/shared/types';

// Track ドメイン型
export type { TrackInfo, StartLine, Course, CourseEffect } from './domain/track/types';

// Player ドメイン型
export type { DriftState, HeatState, Player } from './domain/player/types';

// Race ドメイン型
export type { GamePhase, GameMode, RaceConfig, RaceState, GameResults } from './domain/race/types';

// Card ドメイン型
export type { CardCategory, CardRarity, CardEffect, Card, DeckState } from './domain/card/types';

// Highlight ドメイン型
export type { HighlightType, HighlightEvent } from './domain/highlight/types';

// エフェクト関連型（まだドメインに移行していないのでここに残す）
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
};
export type Spark = { x: number; y: number; vx: number; vy: number; color: string; life: number };
export type Confetti = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  rotSpd: number;
};

export type Decoration = { x: number; y: number; variant: number };
