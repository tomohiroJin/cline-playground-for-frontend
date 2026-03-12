/**
 * KEYS & ARMS — パーティクルの型定義
 */

/** 単一パーティクル */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  s: number;
  rot: number;
  gravity: number;
}

/** パーティクルプール */
export type ParticlePool = Particle[];

/** パーティクル生成パラメータ */
export interface ParticleSpawnParams {
  readonly x: number;
  readonly y: number;
  readonly n?: number;
  readonly vxSpread?: number;
  readonly vySpread?: number;
  readonly vyBase?: number;
  readonly life?: number;
  readonly s?: number;
  readonly rot?: boolean;
  readonly gravity?: number;
}

/** ポップアップテキスト */
export interface Popup {
  x: number;
  y: number;
  t: string;
  life: number;
}

/** パーティクルシステム API */
export interface ParticleSystemAPI {
  spawn(pool: ParticlePool, params: ParticleSpawnParams): ParticlePool;
  updateAndDraw(pool: ParticlePool, color?: string): void;
}

/** ポップアップシステム API */
export interface PopupSystemAPI {
  pool: Popup[];
  add(x: number, y: number, t: string): void;
  clear(): void;
  updateAndDraw(): void;
}

/** createParticles の戻り値型 */
export interface ParticlesModule {
  Particles: ParticleSystemAPI;
  Popups: PopupSystemAPI;
}
