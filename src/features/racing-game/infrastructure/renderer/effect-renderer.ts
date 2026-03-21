// エフェクト描画（旧 Render オブジェクトへの委譲）

import type { Particle, Spark, Confetti } from '../../types';
import { Render } from '../../renderer';

/** パーティクル + スパーク描画 */
export const renderParticles = (ctx: CanvasRenderingContext2D, particles: readonly Particle[], sparks: readonly Spark[]): void => {
  Render.particles(ctx, particles as Particle[], sparks as Spark[]);
};

/** コンフェッティ描画 */
export const renderConfetti = (ctx: CanvasRenderingContext2D, items: readonly Confetti[]): void => {
  Render.confetti(ctx, items as Confetti[]);
};

/** 花火描画 */
export const renderFireworks = (ctx: CanvasRenderingContext2D, time: number): void => {
  Render.fireworks(ctx, time);
};
