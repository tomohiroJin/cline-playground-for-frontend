// メインコンポーネント
export { default as LabyrinthOfShadowsGame } from './LabyrinthOfShadowsGame';

// 型定義
export type {
  Difficulty,
  EntityType,
  EnemyType,
  SoundName,
  Entity,
  Player,
  Enemy,
  Item,
  Sprite,
  GameState,
  HUDData,
} from './types';

// ドメイン層
export type { Position, ItemType } from './domain/types';
export type { GameEvent } from './application/game-events';
export { GAME_BALANCE } from './domain/constants';

// インフラ層
export type { IAudioService } from './infrastructure/audio/audio-service';
export { WebAudioService, NullAudioService } from './infrastructure/audio/audio-service';
export { getBrickColor } from './infrastructure/rendering/brick-texture';
export { RENDER_CONFIG } from './infrastructure/rendering/render-config';

// レガシーエクスポート（後方互換性のため維持）
export { CONFIG, CONTENT } from './constants';
export { MazeService } from './maze-service';
export { AudioService } from './audio';
export { EntityFactory, GameStateFactory } from './entity-factory';
export { GameLogic } from './game-logic';
export { Renderer } from './renderer';
export { MinimapRenderer } from './minimap-renderer';
