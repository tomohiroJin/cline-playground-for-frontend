import { getConstants, GameConstants } from './core/constants';
import { ITEMS } from './core/config';
import {
  FieldConfig,
  GameEffects,
  EffectState,
  Mallet,
  Puck,
  Item,
  GoalEffect,
  Obstacle,
  ObstacleState,
  Particle,
} from './core/types';

// Renderer モジュール - 描画責務のみ
export const Renderer = {
  // 6-4. 背景グラデーションアニメーション
  clear(ctx: CanvasRenderingContext2D, consts: GameConstants = getConstants(), now = 0) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    if (now > 0) {
      const shift = Math.sin(now * 0.0005) * 10;
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgb(${13 + shift}, ${17 + shift}, ${23 + shift})`);
      grad.addColorStop(1, `rgb(${13 - shift}, ${17 - shift}, ${23 - shift})`);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#0d1117';
    }
    ctx.fillRect(0, 0, W, H);
  },
  // 6-5. フィールドラインネオン強化
  drawField(ctx: CanvasRenderingContext2D, field: FieldConfig, consts: GameConstants = getConstants(), obstacleStates: ObstacleState[] = []) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const scale = W / 300;
    ctx.strokeStyle = field.color;
    ctx.lineWidth = 5;
    ctx.shadowColor = field.color;
    ctx.shadowBlur = 20;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = field.color + '55';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(10, H / 2);
    ctx.lineTo(W - 10, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // 中央円にもネオン効果
    ctx.shadowColor = field.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const gs = field.goalSize * scale;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(W / 2 - gs / 2, 0, gs, 8);
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#33ffff';
    ctx.fillRect(W / 2 - gs / 2, H - 8, gs, 8);
    ctx.shadowBlur = 0;
    field.obstacles.forEach((ob: Obstacle, i: number) => {
      const obState = obstacleStates[i];

      // 破壊済みの障害物はスキップ
      if (obState?.destroyed) return;

      const hpRatio = obState ? obState.hp / obState.maxHp : 1;
      // HP に応じてサイズ変化（0.5〜1.0）
      const sizeScale = 0.5 + 0.5 * hpRatio;
      const drawR = ob.r * scale * sizeScale;

      // HP に応じた色変化: 満HP=フィールドカラー → 中HP=黄色 → 低HP=赤
      let fillColor: string;
      let strokeColor: string;
      if (!obState || hpRatio === 1) {
        fillColor = field.color + '44';
        strokeColor = field.color;
      } else if (hpRatio > 0.5) {
        fillColor = '#ffaa0044';
        strokeColor = '#ffaa00';
      } else {
        fillColor = '#ff333344';
        strokeColor = '#ff3333';
      }

      // ダメージ時のネオン効果を強化
      if (obState && hpRatio < 1) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10 + (1 - hpRatio) * 15;
      }

      ctx.beginPath();
      ctx.arc(ob.x * scale, ob.y * scale, drawR, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  },
  drawEffectZones(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number, consts: GameConstants = getConstants()) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const isActive = (eff: EffectState) => eff?.speed && now - eff.speed.start < eff.speed.duration;
    if (isActive(effects.player)) {
      ctx.fillStyle = '#00ffff20';
      ctx.fillRect(5, H / 2, W - 10, H / 2 - 5);
    }
    if (isActive(effects.cpu)) {
      ctx.fillStyle = '#ff444420';
      ctx.fillRect(5, 5, W - 10, H / 2 - 5);
    }
  },
  drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    fillStyle: string,
    strokeStyle: string | null = null,
    lineWidth = 2
  ) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  },
  // 6-2. マレットグロー強化
  drawMallet(ctx: CanvasRenderingContext2D, mallet: Mallet, color: string, hasGlow: boolean, consts: GameConstants = getConstants()) {
    const { MALLET: MR } = consts.SIZES;
    // 常時弱いグロー
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    if (hasGlow) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 25;
    }
    this.drawCircle(ctx, mallet.x, mallet.y, MR, color, '#fff', 3);
    ctx.shadowBlur = 0;
    this.drawCircle(ctx, mallet.x, mallet.y, 8, '#fff');
  },
  // 6-1. パックトレイル
  drawPuckTrail(ctx: CanvasRenderingContext2D, puck: Puck, consts: GameConstants = getConstants()) {
    const { PUCK: BR } = consts.SIZES;
    if (!puck.trail || puck.trail.length === 0 || !puck.visible) return;
    for (let i = 0; i < puck.trail.length; i++) {
      const t = puck.trail[i];
      const alpha = ((i + 1) / puck.trail.length) * 0.3;
      const size = BR * ((i + 1) / puck.trail.length) * 0.8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  },
  drawPuck(ctx: CanvasRenderingContext2D, puck: Puck, consts: GameConstants = getConstants()) {
    const { PUCK: BR } = consts.SIZES;
    if (!puck.visible) return;
    this.drawPuckTrail(ctx, puck, consts);
    this.drawCircle(ctx, puck.x, puck.y, BR, '#fff', '#888', 2);
  },
  drawItem(ctx: CanvasRenderingContext2D, item: Item, now: number, consts: GameConstants = getConstants()) {
    const { ITEM: IR } = consts.SIZES;
    const pulse = 1 + Math.sin(now * 0.008) * 0.2;
    this.drawCircle(ctx, item.x, item.y, IR * pulse, item.color);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);
  },
  drawHUD(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number, consts: GameConstants = getConstants()) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    const playerEff = effects.player;
    if (playerEff.speed && now - playerEff.speed.start < playerEff.speed.duration) {
      const remaining = Math.ceil(
        (playerEff.speed.duration - (now - playerEff.speed.start)) / 1000
      );
      ctx.fillStyle = '#00ffff';
      ctx.fillText(`⚡${remaining}s`, W / 2, H - 25);
    }
    if (playerEff.invisible > 0) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillText(`👻x${playerEff.invisible}`, W / 2, H - 45);
    }
  },
  drawFlash(
    ctx: CanvasRenderingContext2D,
    flash: { type: string; time: number } | null,
    now: number,
    consts: GameConstants = getConstants()
  ) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    if (!flash || now - flash.time >= consts.TIMING.FLASH) return;
    const alpha = 1 - (now - flash.time) / consts.TIMING.FLASH;
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
    ctx.fillRect(0, 0, W, H);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const item = ITEMS.find(i => i.id === flash.type);
    if (item) {
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(`${item.icon} ${item.name}!`, W / 2, H / 2);
    }
  },
  drawGoalEffect(ctx: CanvasRenderingContext2D, effect: GoalEffect | null, now: number, consts: GameConstants = getConstants()) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    if (!effect) return;
    const elapsed = now - effect.time;
    if (elapsed >= consts.TIMING.GOAL_EFFECT) return;
    const isPlayerGoal = effect.scorer === 'cpu';
    const alpha = Math.max(0, 0.5 - elapsed / 1000);
    ctx.fillStyle = isPlayerGoal ? `rgba(0,255,255,${alpha})` : `rgba(255,0,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Arial';
    const textY = H / 2 + Math.sin(elapsed * 0.01) * 10;
    ctx.fillStyle = isPlayerGoal ? '#00ffff' : '#ff4444';
    ctx.shadowColor = isPlayerGoal ? '#00ffff' : '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillText(isPlayerGoal ? 'GOAL!' : 'LOSE...', W / 2, textY);
    ctx.font = 'bold 20px Arial';
    ctx.fillText(isPlayerGoal ? '🎉 +1 Pt!' : '😢 -1 Pt', W / 2, textY + 40);
    ctx.shadowBlur = 0;
  },
  drawHelp(ctx: CanvasRenderingContext2D, consts: GameConstants = getConstants()) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🎮 How to Play', W / 2, 40);
    ctx.font = '13px Arial';
    ctx.fillText('Hit the puck with your mallet!', W / 2, 70);
    ctx.font = 'bold 14px Arial';
    ctx.fillText('◆Split ⚡Speed 👻Hide', W / 2, 110);
    ctx.font = '12px Arial';
    ctx.fillText('Shoot items into opponent goal!', W / 2, 140);
    ctx.fillStyle = '#888';
    ctx.fillText('Tap to Start', W / 2, H - 20);
  },
  drawFeverEffect(ctx: CanvasRenderingContext2D, active: boolean, now: number, consts: GameConstants = getConstants()) {
    if (!active) return;
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const hue = (now * 0.1) % 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.05)`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Arial';
    const textHue = (now * 0.2) % 360;
    ctx.fillStyle = `hsl(${textHue}, 100%, 60%)`;
    ctx.shadowColor = `hsl(${textHue}, 100%, 50%)`;
    ctx.shadowBlur = 15;
    const bounce = Math.sin(now * 0.005) * 5;
    ctx.fillText('FEVER TIME!', W / 2, 30 + bounce);
    ctx.shadowBlur = 0;
    ctx.restore();
  },
  // 6-3. ゴールパーティクル描画
  drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
      ctx.fill();
    }
  },
};
