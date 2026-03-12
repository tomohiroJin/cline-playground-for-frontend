/**
 * KEYS & ARMS — エンジンコンテキストの型定義
 */
import type { GameState } from './game-state';
import type { DrawingAPI } from './rendering';
import type { AudioModule } from './audio';
import type { ParticlesModule } from './particles';
import type { HUDModule } from './hud';

/** エンジンコンテキスト（各モジュールに渡される依存関係の束） */
export interface EngineContext {
  G: GameState;
  draw: DrawingAPI;
  audio: AudioModule;
  particles: ParticlesModule;
  hud: HUDModule;
}
