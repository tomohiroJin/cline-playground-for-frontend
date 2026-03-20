/**
 * フィールドレンダラー
 * - フィールド背景・障害物・ゴールエリアの描画
 */
import type { FieldConfig, Obstacle, ObstacleState } from '../../domain/types';
import type { GameConstants } from '../../core/constants';

export class FieldRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly consts: GameConstants
  ) {}

  /** 背景グラデーションアニメーション */
  clear(now: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    if (now > 0) {
      const shift = Math.sin(now * 0.0005) * 10;
      const grad = this.ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgb(${13 + shift}, ${17 + shift}, ${23 + shift})`);
      grad.addColorStop(1, `rgb(${13 - shift}, ${17 - shift}, ${23 - shift})`);
      this.ctx.fillStyle = grad;
    } else {
      this.ctx.fillStyle = '#0d1117';
    }
    this.ctx.fillRect(0, 0, W, H);
  }

  /** フィールド描画 */
  drawField(field: FieldConfig, obstacleStates: ObstacleState[], now: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;

    // 外枠（木目風グラデーション + 多重線）
    const frameGrad = this.ctx.createLinearGradient(0, 0, W, H);
    frameGrad.addColorStop(0, '#2a1810');
    frameGrad.addColorStop(0.5, '#3d2518');
    frameGrad.addColorStop(1, '#1a0e08');
    this.ctx.strokeStyle = frameGrad;
    this.ctx.lineWidth = 12;
    this.ctx.strokeRect(6, 6, W - 12, H - 12);

    // 内枠（光沢ハイライト）
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(12, 12, W - 24, H - 24);

    // フィールドカラーのネオン枠線
    this.ctx.strokeStyle = field.color;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = field.color;
    this.ctx.shadowBlur = 15;
    this.ctx.strokeRect(12, 12, W - 24, H - 24);
    this.ctx.shadowBlur = 0;

    // フィールド面の照明効果（放射グラデーション）
    const lightGrad = this.ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.6);
    lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    lightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.015)');
    lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    this.ctx.fillStyle = lightGrad;
    this.ctx.fillRect(12, 12, W - 24, H - 24);

    // 中央ライン（二重線 + 装飾）
    this.ctx.strokeStyle = field.color + '33';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(15, H / 2);
    this.ctx.lineTo(W - 15, H / 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = field.color + '66';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(15, H / 2 - 3);
    this.ctx.lineTo(W - 15, H / 2 - 3);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(15, H / 2 + 3);
    this.ctx.lineTo(W - 15, H / 2 + 3);
    this.ctx.stroke();

    // 中央円（装飾 + ネオングロー）
    this.ctx.shadowColor = field.color;
    this.ctx.shadowBlur = 15;
    this.ctx.strokeStyle = field.color + '55';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(W / 2, H / 2, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = field.color + '44';
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // ゴールエリア（LED風発光）
    this.drawGoalLEDs(field, W, H);

    // 障害物
    this.drawObstacles(field, obstacleStates, now);
  }

  private drawGoalLEDs(field: FieldConfig, W: number, H: number): void {
    const gs = field.goalSize;
    const drawGoalLED = (y: number, color: string, glowColor: string) => {
      const gx = W / 2 - gs / 2;
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 25;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(gx, y, gs, 6);
      this.ctx.shadowBlur = 0;
      const dotCount = Math.floor(gs / 12);
      for (let i = 0; i < dotCount; i++) {
        const dx = gx + 6 + i * 12;
        this.ctx.beginPath();
        this.ctx.arc(dx, y + 3, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();
      }
    };
    drawGoalLED(0, '#ff3333', '#ff0000');
    drawGoalLED(H - 6, '#33ffff', '#00ffff');
  }

  private drawObstacles(field: FieldConfig, obstacleStates: ObstacleState[], now: number): void {
    field.obstacles.forEach((ob: Obstacle, i: number) => {
      const obState = obstacleStates[i];

      if (obState?.destroyed) {
        const respawnMs = field.obstacleRespawnMs ?? this.consts.TIMING.OBSTACLE_RESPAWN;
        const elapsed = now - obState.destroyedAt;
        if (elapsed > respawnMs - 1000) {
          const blink = Math.sin(now * 0.015) > 0;
          if (blink) {
            this.ctx.beginPath();
            this.ctx.arc(ob.x, ob.y, ob.r * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = field.color + '22';
            this.ctx.fill();
          }
        }
        return;
      }

      const hpRatio = obState ? obState.hp / obState.maxHp : 1;
      const sizeScale = 0.5 + 0.5 * hpRatio;
      const drawR = ob.r * sizeScale;

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

      if (obState && hpRatio < 1) {
        this.ctx.shadowColor = strokeColor;
        this.ctx.shadowBlur = 10 + (1 - hpRatio) * 15;
      }

      this.ctx.beginPath();
      this.ctx.arc(ob.x, ob.y, drawR, 0, Math.PI * 2);
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    });
  }
}
