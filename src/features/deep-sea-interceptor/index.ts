// ============================================================================
// Deep Sea Interceptor - re-export
// ============================================================================

export { default as DeepSeaInterceptorGame } from './DeepSeaInterceptorGame';
export type {
  Position,
  BaseEntity,
  Bullet,
  Enemy,
  EnemyBullet,
  Item,
  Particle,
  Bubble,
  GameState,
  UiState,
  EnemyType,
  ItemType,
} from './types';
export { Config, StageConfig, EnemyConfig, ItemConfig, ColorPalette } from './constants';
export { EntityFactory } from './entities';
export { MovementStrategies } from './movement';
export { Collision } from './collision';
export { EnemyAI } from './enemy-ai';
export { createAudioSystem } from './audio';
export { createInitialGameState, createInitialUiState, updateFrame } from './game-logic';
export { useDeepSeaGame } from './hooks';
