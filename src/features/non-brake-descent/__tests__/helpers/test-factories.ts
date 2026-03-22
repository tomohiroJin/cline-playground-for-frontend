/**
 * テスト用ファクトリ関数
 *
 * 各ビルダー関数は Partial<T> のオーバーライドを受け取り、
 * デフォルト値とマージしたオブジェクトを返す。
 */
import { ObstacleType, RampType } from '../../constants';
import type {
  Player,
  Obstacle,
  Ramp,
  Particle,
  ScorePopup,
  NearMissEffect,
  CollisionCheckResult,
  InputState,
  EffectState,
} from '../../types';

/** テスト用 Player オブジェクトを生成する */
export const buildPlayer = (overrides?: Partial<Player>): Player => ({
  x: 60,
  y: 0,
  ramp: 0,
  vx: 0,
  vy: 0,
  jumping: false,
  jumpCD: 0,
  onGround: true,
  ...overrides,
});

/** テスト用 Obstacle オブジェクトを生成する */
export const buildObstacle = (overrides?: Partial<Obstacle>): Obstacle => ({
  t: ObstacleType.ROCK,
  pos: 0.5,
  passed: false,
  ...overrides,
});

/** テスト用 Ramp オブジェクトを生成する */
export const buildRamp = (overrides?: Partial<Ramp>): Ramp => ({
  dir: 1,
  obs: [],
  type: RampType.NORMAL,
  isGoal: false,
  ...overrides,
});

/** テスト用 Particle オブジェクトを生成する */
export const buildParticle = (overrides?: Partial<Particle>): Particle => ({
  x: 0,
  y: 0,
  color: '#fff',
  vx: 0,
  vy: 0,
  life: 25,
  ...overrides,
});

/** テスト用 ScorePopup オブジェクトを生成する */
export const buildScorePopup = (
  overrides?: Partial<ScorePopup>
): ScorePopup => ({
  x: 0,
  y: 0,
  text: '+100',
  color: '#fff',
  life: 60,
  vy: -2,
  ...overrides,
});

/** テスト用 NearMissEffect オブジェクトを生成する */
export const buildNearMissEffect = (
  overrides?: Partial<NearMissEffect>
): NearMissEffect => ({
  x: 0,
  y: 0,
  life: 30,
  scale: 1,
  ...overrides,
});

/** テスト用 CollisionCheckResult オブジェクトを生成する */
export const buildCollisionCheckResult = (
  overrides?: Partial<CollisionCheckResult>
): CollisionCheckResult => ({
  ground: false,
  air: false,
  hit: false,
  nearMiss: false,
  dist: 100,
  ...overrides,
});

/** テスト用 InputState オブジェクトを生成する */
export const buildInputState = (
  overrides?: Partial<InputState>
): InputState => ({
  left: false,
  right: false,
  accel: false,
  jump: false,
  ...overrides,
});

/** テスト用 EffectState オブジェクトを生成する */
export const buildEffectState = (
  overrides?: Partial<EffectState>
): EffectState => ({
  type: undefined,
  timer: 0,
  ...overrides,
});
