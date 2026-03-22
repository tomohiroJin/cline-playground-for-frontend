import { Config } from '../../config';
import { MathUtils } from '../math-utils';
import { NearMissEffect, Particle, ScorePopup } from '../../types';

const randomBool = MathUtils.randomBool;

/** パーティクルを1つ生成する */
export const createParticle = (
  x: number,
  y: number,
  color: string,
  lifetime: number = Config.particle.lifetime
): Particle => ({
  x,
  y,
  color,
  vx: MathUtils.randomRange(-3, 3),
  vy: -Math.random() * 5,
  life: lifetime,
});

/** 複数のパーティクルを生成する */
export const createParticles = (
  x: number,
  y: number,
  color: string,
  count: number = Config.particle.defaultCount
): Particle[] =>
  Array.from({ length: count }, () => createParticle(x, y, color));

/** ジェットエフェクト用パーティクルを生成する */
export const createJetParticle = (
  x: number,
  y: number,
  dir: number
): Particle => ({
  x: x - dir * 10 + MathUtils.randomRange(-4, 4),
  y: y + 5,
  color: randomBool() ? '#ff6600' : '#ffaa00',
  vx: -dir * MathUtils.randomRange(2, 5),
  vy: MathUtils.randomRange(-1, 1),
  life: MathUtils.randomRange(15, 25),
});

/** スコアポップアップを生成する */
export const createScorePopup = (
  x: number,
  y: number,
  text: string,
  color = '#fff'
): ScorePopup => ({
  x,
  y,
  text,
  color,
  life: 60,
  vy: -2,
});

/** ニアミスエフェクトを生成する */
export const createNearMissEffect = (
  x: number,
  y: number
): NearMissEffect => ({
  x,
  y,
  life: 30,
  scale: 1,
});
