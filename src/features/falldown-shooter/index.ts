// 落ち物シューティング barrel export

export { FalldownShooterGame } from './FalldownShooterGame';

// 旧ロジックモジュール（後方互換性のため維持）
export { Grid } from './grid';
export { Block } from './block';
export { Bullet } from './bullet';
export { Collision } from './collision';
export { GameLogic } from './game-logic';
export { Stage } from './stage';
export { Audio } from './audio';

// 新ドメインモデル
export { GridModel } from './domain/models/grid';
export { BlockModel } from './domain/models/block';
export { BulletModel } from './domain/models/bullet';
export { ScoreCalculator } from './domain/models/score';

// ドメインサービス
export { CollisionService } from './domain/services/collision-service';
export { SpawnService } from './domain/services/spawn-service';
export { SkillService } from './domain/services/skill-service';

// アプリケーション層
export { NullAudioAdapter } from './application/audio-service';
export type { IAudioService } from './application/audio-service';

// インフラ層
export { WebAudioAdapter } from './infrastructure/web-audio-adapter';
export { ScoreStorageAdapter } from './infrastructure/score-storage-adapter';
export type { IScoreRepository } from './infrastructure/score-storage-adapter';

// 定数・型・ユーティリティ
export { CONFIG, BLOCK_COLORS, BLOCK_SHAPES, POWER_TYPES, SKILLS, DEMO_SLIDES } from './constants';
export { uid, pick, calcTiming } from './utils';
export type {
  PowerType,
  SkillType,
  GameStatus,
  Difficulty,
  OscillatorType,
  TimingConfig,
  Config,
  PowerTypeInfo,
  SkillInfo,
  Cell,
  BlockData,
  BulletData,
  GameState,
  ExplosionData,
  ParticleData,
  Powers,
  CollisionTarget,
  BulletProcessResult,
  DemoSlide,
  KeyboardHandlers,
  DifficultyConfig,
} from './types';
