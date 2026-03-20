/**
 * エフェクトレンダラー
 * - パーティクル・衝撃波・ヒットストップ・フィーバーなどの描画
 */
import { DOMAIN_ITEMS } from '../../domain/constants/items';
import type {
  GameEffects,
  EffectState,
  GoalEffect,
  Mallet,
  ItemType,
  Particle,
  HitStopState,
} from '../../domain/types';
import type { GameConstants } from '../../core/constants';

export class EffectRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly consts: GameConstants
  ) {}

  /** エフェクトゾーン描画 */
  drawEffectZones(effects: GameEffects, now: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    const isActive = (eff: EffectState) => eff?.speed && now - eff.speed.start < eff.speed.duration;
    if (isActive(effects.player)) {
      this.ctx.fillStyle = '#00ffff20';
      this.ctx.fillRect(5, H / 2, W - 10, H / 2 - 5);
    }
    if (isActive(effects.cpu)) {
      this.ctx.fillStyle = '#ff444420';
      this.ctx.fillRect(5, 5, W - 10, H / 2 - 5);
    }
  }

  /** アイテムフラッシュ描画 */
  drawFlash(
    flash: { type: string; time: number } | null,
    now: number
  ): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    if (!flash || now - flash.time >= this.consts.TIMING.FLASH) return;
    const alpha = 1 - (now - flash.time) / this.consts.TIMING.FLASH;
    this.ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
    this.ctx.fillRect(0, 0, W, H);
    const item = DOMAIN_ITEMS.find(i => i.id === (flash.type as ItemType));
    if (item) {
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this.ctx.fillText(`${item.icon} ${item.name}!`, W / 2, H / 2);
    }
  }

  /** ゴールエフェクト描画 */
  drawGoalEffect(effect: GoalEffect | null, now: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    if (!effect) return;
    const elapsed = now - effect.time;
    if (elapsed >= this.consts.TIMING.GOAL_EFFECT) return;
    const isPlayerGoal = effect.scorer === 'cpu';
    const alpha = Math.max(0, 0.5 - elapsed / 1000);
    this.ctx.fillStyle = isPlayerGoal ? `rgba(0,255,255,${alpha})` : `rgba(255,0,0,${alpha})`;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 36px Arial';
    const textY = H / 2 + Math.sin(elapsed * 0.01) * 10;
    this.ctx.fillStyle = isPlayerGoal ? '#00ffff' : '#ff4444';
    this.ctx.shadowColor = isPlayerGoal ? '#00ffff' : '#ff0000';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(isPlayerGoal ? 'GOAL!' : 'LOSE...', W / 2, textY);
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(isPlayerGoal ? '🎉 +1 Pt!' : '😢 -1 Pt', W / 2, textY + 40);
    this.ctx.shadowBlur = 0;
  }

  /** フィーバーエフェクト描画 */
  drawFeverEffect(active: boolean, now: number): void {
    if (!active) return;
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    const hue = (now * 0.1) % 360;
    this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.05)`;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 24px Arial';
    const textHue = (now * 0.2) % 360;
    this.ctx.fillStyle = `hsl(${textHue}, 100%, 60%)`;
    this.ctx.shadowColor = `hsl(${textHue}, 100%, 50%)`;
    this.ctx.shadowBlur = 15;
    const bounce = Math.sin(now * 0.005) * 5;
    this.ctx.fillText('FEVER TIME!', W / 2, 30 + bounce);
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  /** パーティクル描画 */
  drawParticles(particles: Particle[]): void {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
      this.ctx.fill();
    }
  }

  /** 衝撃波描画 */
  drawShockwave(hitStop: HitStopState): void {
    if (!hitStop.active) return;
    const { impactX, impactY, shockwaveRadius, shockwaveMaxRadius } = hitStop;
    const alpha = 1 - shockwaveRadius / shockwaveMaxRadius;

    this.ctx.beginPath();
    this.ctx.arc(impactX, impactY, shockwaveRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(impactX, impactY, shockwaveRadius * 0.6, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.4})`;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  /** ビネット効果描画 */
  drawVignette(intensity = 0.5): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    const grad = this.ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, W, H);
  }

  /** シールドバリア描画 */
  drawShield(isPlayer: boolean, goalSize: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    const y = isPlayer ? H - 8 : 8;

    this.ctx.save();
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 15;
    this.ctx.globalAlpha = 0.7;
    this.ctx.beginPath();
    this.ctx.moveTo(W / 2 - goalSize / 2, y);
    this.ctx.lineTo(W / 2 + goalSize / 2, y);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  /** マグネットエフェクト描画 */
  drawMagnetEffect(mallet: Mallet, now: number): void {
    this.ctx.save();
    const pulse = 1 + Math.sin(now * 0.008) * 0.3;
    const radius = 60 * pulse;
    this.ctx.beginPath();
    this.ctx.arc(mallet.x, mallet.y, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  /** リアクション吹き出し描画 */
  drawReaction(text: string, side: 'player' | 'cpu', elapsed: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    const REACTION_DURATION = 1500;
    const alpha = Math.max(0, 1 - elapsed / REACTION_DURATION);
    if (alpha <= 0) return;

    const x = W * 0.7;
    const y = side === 'cpu' ? H * 0.15 : H * 0.85;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const metrics = this.ctx.measureText(text);
    const padding = 12;
    const bw = metrics.width + padding * 2;
    const bh = 32;
    const rx = x - bw / 2;
    const ry = y - bh / 2;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.beginPath();
    this.ctx.roundRect(rx, ry, bw, bh, 8);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }
}
