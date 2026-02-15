import { CONSTANTS } from './core/constants';
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
} from './core/types';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const { MALLET: MR, PUCK: BR, ITEM: IR } = CONSTANTS.SIZES;

// Renderer モジュール - 描画責務のみ
export const Renderer = {
  clear(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  },
  drawField(
    ctx: CanvasRenderingContext2D,
    field: FieldConfig,
    obstacleStates: ObstacleState[] = [],
    now = 0
  ) {
    ctx.strokeStyle = field.color;
    ctx.lineWidth = 5;
    ctx.shadowColor = field.color;
    ctx.shadowBlur = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = field.color + '55';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(10, H / 2);
    ctx.lineTo(W - 10, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
    const gs = field.goalSize;
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

      // 破壊済みの障害物
      if (obState && obState.destroyedAt !== null) {
        const respawnMs = field.obstacleRespawnMs ?? CONSTANTS.TIMING.OBSTACLE_RESPAWN;
        const elapsed = now - obState.destroyedAt;
        // 復活間近（残り1秒以内）で点滅表示
        if (elapsed > respawnMs - 1000) {
          const blink = Math.sin(now * 0.015) > 0;
          if (blink) {
            ctx.beginPath();
            ctx.arc(ob.x, ob.y, ob.r * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = field.color + '22';
            ctx.fill();
          }
        }
        return;
      }

      // HP に応じたダメージ表現
      let alpha = '44';
      let scale = 1;
      if (obState && obState.maxHp > 0) {
        const hpRatio = obState.hp / obState.maxHp;
        // HPが減るほど透明度UP・サイズ縮小
        const alphaVal = Math.round(0x44 + (0xaa - 0x44) * hpRatio);
        alpha = alphaVal.toString(16).padStart(2, '0');
        scale = 0.7 + 0.3 * hpRatio;
      }

      ctx.beginPath();
      ctx.arc(ob.x, ob.y, ob.r * scale, 0, Math.PI * 2);
      ctx.fillStyle = field.color + alpha;
      ctx.fill();
      ctx.strokeStyle = field.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },
  drawEffectZones(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number) {
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
  drawMallet(ctx: CanvasRenderingContext2D, mallet: Mallet, color: string, hasGlow: boolean) {
    if (hasGlow) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 15;
    }
    this.drawCircle(ctx, mallet.x, mallet.y, MR, color, '#fff', 3);
    ctx.shadowBlur = 0;
    this.drawCircle(ctx, mallet.x, mallet.y, 8, '#fff');
  },
  drawPuck(ctx: CanvasRenderingContext2D, puck: Puck) {
    if (!puck.visible) return;
    this.drawCircle(ctx, puck.x, puck.y, BR, '#fff', '#888', 2);
  },
  drawItem(ctx: CanvasRenderingContext2D, item: Item, now: number) {
    const pulse = 1 + Math.sin(now * 0.008) * 0.2;
    this.drawCircle(ctx, item.x, item.y, IR * pulse, item.color);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);
  },
  drawHUD(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number) {
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
    now: number
  ) {
    if (!flash || now - flash.time >= CONSTANTS.TIMING.FLASH) return;
    const alpha = 1 - (now - flash.time) / CONSTANTS.TIMING.FLASH;
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
  drawGoalEffect(ctx: CanvasRenderingContext2D, effect: GoalEffect | null, now: number) {
    if (!effect) return;
    const elapsed = now - effect.time;
    if (elapsed >= CONSTANTS.TIMING.GOAL_EFFECT) return;
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
  drawHelp(ctx: CanvasRenderingContext2D) {
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
};
