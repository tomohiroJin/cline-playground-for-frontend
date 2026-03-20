// Racing Game re-export
// 旧モジュール（後方互換）と新ドメイン/アプリケーション層モジュールの両方を公開

// === メインコンポーネント ===
export { default as RacingGame } from './RacingGame';

// === 旧モジュール（後方互換: RacingGame.tsx が直接参照） ===
export type { Point, Checkpoint, StartLine, Particle, Spark, Confetti, Course, Player, Decoration, GameResults, GamePhase, DriftState, HeatState, CourseEffect, CardCategory, CardRarity, CardEffect, Card, DeckState, HighlightType, HighlightEvent } from './types';
export { Config, Colors, Options, Courses, DRIFT, HEAT, WALL } from './constants';
export { Utils } from './utils';
export { SoundEngine } from './audio';
export { Entity } from './entities';
export { Track } from './track';
export { Render, renderDecos } from './renderer';
export { Logic } from './game-logic';
export { useInput, useIdle } from './hooks';
export { VolumeCtrl } from './components/VolumeControl';
export { DraftCards } from './draft-cards';
export { HIGHLIGHT_LABELS, HIGHLIGHT_COLORS } from './highlight';
export { getCardMultiplier, computeAllCardEffects } from './card-effects';
export type { ComputedCardEffects } from './card-effects';
export { createHeatState, updateHeat, getHeatBoost } from './domain/player/heat';
export { getCourseEffect, getSegmentFriction, getSegmentSpeedModifier } from './domain/track/course-effect';
export { calculateWallPenalty, shouldWarp, calculateWarpDestination, calculateSlideVector, calculateSlideAngle, calculateWallSlidePosition } from './domain/track/wall-physics';

// === 新ドメイン層モジュール ===
export type { GameMode, RaceConfig, RaceState } from './domain/race/types';
export type { TrackInfo, CourseDecoType } from './domain/track/types';
export type { PlayerIdentity, PlayerState } from './domain/player/types';
export type { SpecialType } from './domain/card/types';
export type { NumericCardField } from './domain/card/card-effect';
export type { PlayerHighlightState, HighlightTracker } from './domain/highlight/types';
export type { DomainEvent } from './domain/events';

// === 新アプリケーション層モジュール ===
export { createOrchestrator } from './application/game-orchestrator';
export type { GameOrchestratorConfig, GameOrchestratorState, GameOrchestrator } from './application/game-orchestrator';
export { createEventBus } from './application/game-event-bus';
export type { GameEventBus } from './application/game-event-bus';
export { processInput } from './application/input-processor';
export type { PlayerCommand } from './application/input-processor';
export type { RendererPort } from './application/ports/renderer-port';
export type { AudioPort, SfxType, WallStage } from './application/ports/audio-port';
export type { StoragePort } from './application/ports/storage-port';
export type { InputPort, InputState, DraftInput } from './application/ports/input-port';

// === 新インフラストラクチャ層モジュール ===
export { createCanvasRenderer } from './infrastructure/renderer/canvas-renderer';
export { createWebAudioEngine } from './infrastructure/audio/sound-engine';
export { createLocalStorageRepository } from './infrastructure/storage/score-repository';
export { createKeyboardAdapter } from './infrastructure/input/keyboard-adapter';

// === 新プレゼンテーション層フック ===
export { useGameLoop } from './presentation/hooks/useGameLoop';
export type { UseGameLoopResult } from './presentation/hooks/useGameLoop';
export { useGameState } from './presentation/hooks/useGameState';
export type { GameConfig, UseGameStateResult } from './presentation/hooks/useGameState';
export { useIdle as useIdleNew } from './presentation/hooks/useIdle';
