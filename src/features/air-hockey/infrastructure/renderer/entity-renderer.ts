/**
 * エンティティレンダラー
 * - パック・マレット・アイテムの描画
 */
import type { Mallet, Puck, Item } from '../../domain/types';
import type { GameConstants } from '../../core/constants';
import { magnitude } from '../../../../utils/math-utils';
import {
  lightenColor,
  darkenColor,
  getPuckColorBySpeed,
  getTrailLengthBySpeed,
  SPEED_NORMAL,
  SPEED_FAST,
} from './renderer-utils';

export class EntityRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly consts: GameConstants
  ) {}

  /** 汎用円描画 */
  drawCircle(
    x: number, y: number, r: number,
    fillStyle: string,
    strokeStyle: string | null = null,
    lineWidth = 2
  ): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = fillStyle;
    this.ctx.fill();
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      this.ctx.stroke();
    }
  }

  /** マレット描画 */
  drawMallet(mallet: Mallet, color: string, hasGlow: boolean, sizeScale = 1): void {
    const r = this.consts.SIZES.MALLET * sizeScale;
    const { x, y } = mallet;

    // ドロップシャドウ
    this.ctx.beginPath();
    this.ctx.arc(x + 1, y + 3, r * 0.95, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.fill();

    // 本体ディスク
    const diskGrad = this.ctx.createRadialGradient(x, y, 0, x, y, r);
    diskGrad.addColorStop(0, lightenColor(color, 20));
    diskGrad.addColorStop(0.75, color);
    diskGrad.addColorStop(0.92, darkenColor(color, 30));
    diskGrad.addColorStop(1, darkenColor(color, 60));

    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = diskGrad;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // 外周リング
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // 外周の暗いエッジ
    this.ctx.beginPath();
    this.ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    this.ctx.strokeStyle = darkenColor(color, 50);
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // 上面のハイライト
    this.ctx.beginPath();
    this.ctx.arc(x, y - r * 0.15, r * 0.6, Math.PI * 1.15, Math.PI * 1.85);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // 中央グリップ
    const gripR = r * 0.38;
    const gripGrad = this.ctx.createRadialGradient(x, y, 0, x, y, gripR);
    gripGrad.addColorStop(0, '#ffffff');
    gripGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gripGrad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
    this.ctx.beginPath();
    this.ctx.arc(x, y, gripR, 0, Math.PI * 2);
    this.ctx.fillStyle = gripGrad;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // グロー
    if (hasGlow) {
      this.ctx.shadowColor = '#ff00ff';
      this.ctx.shadowBlur = 25;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }

  /** パックトレイル描画 */
  drawPuckTrail(puck: Puck): void {
    const { PUCK: BR } = this.consts.SIZES;
    if (!puck.trail || puck.trail.length === 0 || !puck.visible) return;

    const speed = magnitude(puck.vx, puck.vy);
    const puckColor = getPuckColorBySpeed(speed);
    const maxTrailLen = getTrailLengthBySpeed(speed);
    const trailPoints = puck.trail.slice(-maxTrailLen);

    for (let i = 0; i < trailPoints.length; i++) {
      const t = trailPoints[i];
      const ratio = (i + 1) / trailPoints.length;
      const alpha = ratio * (speed > SPEED_NORMAL ? 0.5 : 0.3);
      const size = BR * ratio * (speed > SPEED_FAST ? 1.0 : 0.8);
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      const r = parseInt(puckColor.slice(1, 3), 16);
      const g = parseInt(puckColor.slice(3, 5), 16);
      const b = parseInt(puckColor.slice(5, 7), 16);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      this.ctx.fill();
    }
  }

  /** スピードライン描画（超高速時） */
  drawSpeedLines(puck: Puck): void {
    const speed = magnitude(puck.vx, puck.vy);
    if (speed <= SPEED_FAST || !puck.visible) return;

    this.ctx.save();
    const angle = Math.atan2(puck.vy, puck.vx);
    const lineCount = 5;
    for (let i = 0; i < lineCount; i++) {
      const offset = (i - lineCount / 2) * 8;
      const startX = puck.x - Math.cos(angle) * 30 + Math.sin(angle) * offset;
      const startY = puck.y - Math.sin(angle) * 30 - Math.cos(angle) * offset;
      const endX = startX - Math.cos(angle) * 20;
      const endY = startY - Math.sin(angle) * 20;

      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.strokeStyle = `rgba(255, 68, 68, ${0.3 + Math.random() * 0.3})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  /** パック描画 */
  drawPuck(puck: Puck): void {
    if (!puck.visible) return;
    const r = this.consts.SIZES.PUCK;
    const speed = magnitude(puck.vx, puck.vy);
    const color = getPuckColorBySpeed(speed);

    this.drawPuckTrail(puck);
    this.drawSpeedLines(puck);

    // ドロップシャドウ
    this.ctx.beginPath();
    this.ctx.ellipse(puck.x + 1, puck.y + 2, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.fill();

    // 本体（メタリックグラデーション）
    const baseColor = color === '#ffffff' ? '#cccccc' : color;
    const darkBaseColor = color === '#ffffff' ? '#999999' : color;
    const metalGrad = this.ctx.createRadialGradient(
      puck.x - r * 0.2, puck.y - r * 0.2, r * 0.05,
      puck.x, puck.y, r
    );
    metalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    metalGrad.addColorStop(0.3, color);
    metalGrad.addColorStop(0.8, darkenColor(baseColor, 30));
    metalGrad.addColorStop(1, darkenColor(darkBaseColor, 60));

    if (speed > SPEED_NORMAL) {
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = speed > SPEED_FAST ? 25 : 12;
    }

    this.ctx.beginPath();
    this.ctx.arc(puck.x, puck.y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = metalGrad;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // エッジリング
    this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // ハイライト
    this.ctx.beginPath();
    this.ctx.arc(puck.x - r * 0.25, puck.y - r * 0.25, r * 0.15, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fill();
  }

  /** アイテム描画 */
  drawItem(item: Item, now: number): void {
    const { ITEM: IR } = this.consts.SIZES;
    const pulse = 1 + Math.sin(now * 0.008) * 0.2;
    this.drawCircle(item.x, item.y, IR * pulse, item.color);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(item.icon, item.x, item.y);
  }
}
