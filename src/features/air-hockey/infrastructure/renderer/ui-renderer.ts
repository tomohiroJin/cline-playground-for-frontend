/**
 * UI レンダラー
 * - カウントダウン・スコア・HUD・ポーズ・コンボ・ヘルプ画面の描画
 */
import type { GameEffects, FieldConfig, ComboState } from '../../domain/types';
import type { GameConstants } from '../../core/constants';
import type { GamepadToast } from '../../hooks/useGamepadInput';
import { AH_STRINGS } from '../../core/i18n-strings';
import { CANVAS_FONTS } from '../../core/canvas-fonts';

/** トースト描画定数 */
const TOAST_DURATION = 3000;
const FADE_DURATION = 500;
const TOAST_FONT_SIZE = 14;
const TOAST_FONT = CANVAS_FONTS.toast;
const TOAST_PADDING_X = 20;
const TOAST_PADDING_Y = 10;
const TOAST_OFFSET_Y = 100;
const TOAST_BG_CONNECT = 'rgba(0, 128, 0, 0.8)';
const TOAST_BG_DISCONNECT = 'rgba(128, 0, 0, 0.8)';
const TOAST_BORDER_RADIUS = 8;

/**
 * ゲームパッド接続/切断トースト描画（スタンドアロン関数）
 * UiRenderer クラスと Renderer モジュールの両方から呼び出される
 */
export function drawToastOnCanvas(
  ctx: CanvasRenderingContext2D,
  toast: GamepadToast | undefined,
  now: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  if (!toast) return;

  const elapsed = now - toast.timestamp;
  if (elapsed >= TOAST_DURATION) return;

  const fadeStart = TOAST_DURATION - FADE_DURATION;
  const opacity = elapsed < fadeStart
    ? 1.0
    : 1.0 - (elapsed - fadeStart) / FADE_DURATION;

  ctx.save();
  ctx.globalAlpha = opacity;

  const isDisconnect = toast.message.includes('切断');
  ctx.fillStyle = isDisconnect ? TOAST_BG_DISCONNECT : TOAST_BG_CONNECT;

  ctx.font = TOAST_FONT;
  const textWidth = ctx.measureText(toast.message).width;
  const bgWidth = textWidth + TOAST_PADDING_X * 2;
  const bgHeight = TOAST_FONT_SIZE + TOAST_PADDING_Y * 2;
  const bgX = (canvasWidth - bgWidth) / 2;
  const bgY = canvasHeight - TOAST_OFFSET_Y - bgHeight / 2;

  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgWidth, bgHeight, TOAST_BORDER_RADIUS);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(toast.message, canvasWidth / 2, bgY + bgHeight / 2);

  ctx.restore();
}

export class UiRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly consts: GameConstants
  ) {}

  /** HUD 描画（エフェクト残り時間） */
  drawHUD(effects: GameEffects, now: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    this.ctx.textAlign = 'center';
    this.ctx.font = CANVAS_FONTS.hudStatus;
    const playerEff = effects.player;
    if (playerEff.speed && now - playerEff.speed.start < playerEff.speed.duration) {
      const remaining = Math.ceil(
        (playerEff.speed.duration - (now - playerEff.speed.start)) / 1000
      );
      this.ctx.fillStyle = '#00ffff';
      this.ctx.fillText(`⚡${remaining}s`, W / 2, H - 25);
    }
    if (playerEff.invisible > 0) {
      this.ctx.fillStyle = '#ff00ff';
      this.ctx.fillText(`👻x${playerEff.invisible}`, W / 2, H - 45);
    }
  }

  /** ヘルプ画面描画 */
  drawHelp(field?: FieldConfig): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    this.ctx.fillStyle = 'rgba(0,0,0,0.92)';
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.textAlign = 'center';

    this.ctx.fillStyle = '#fff';
    this.ctx.font = CANVAS_FONTS.helpTitle;
    this.ctx.fillText(AH_STRINGS.game.howToPlay, W / 2, 36);

    this.ctx.font = CANVAS_FONTS.helpSubtitle;
    this.ctx.fillStyle = '#ccc';
    this.ctx.fillText(AH_STRINGS.game.helpHint, W / 2, 58);

    this.ctx.font = CANVAS_FONTS.helpSectionTitle;
    this.ctx.fillStyle = 'var(--accent-color, #00d4ff)';
    this.ctx.fillText(AH_STRINGS.game.itemsHeader, W / 2, 86);

    const items = [
      { icon: '◆', name: 'Split', color: '#FF6B6B', desc: 'Puck splits into 3' },
      { icon: '⚡', name: 'Speed', color: '#4ECDC4', desc: 'Speed zone on your side' },
      { icon: '👻', name: 'Hide', color: '#9B59B6', desc: 'Puck turns invisible' },
      { icon: '🛡', name: 'Shield', color: '#FFD700', desc: 'Blocks one goal' },
      { icon: '🧲', name: 'Magnet', color: '#FF6B35', desc: 'Attracts puck to mallet' },
      { icon: '⬆', name: 'Big', color: '#00FF88', desc: 'Mallet size up' },
    ];

    const startY = 108;
    const lineH = 28;
    this.ctx.textAlign = 'left';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const y = startY + i * lineH;
      this.ctx.font = CANVAS_FONTS.helpItem;
      this.ctx.fillStyle = item.color;
      this.ctx.fillText(`${item.icon} ${item.name}`, 30, y);
      this.ctx.font = CANVAS_FONTS.helpItemDesc;
      this.ctx.fillStyle = '#b4b4b4';
      this.ctx.fillText(item.desc, 150, y);
    }

    if (field) {
      const fieldY = startY + items.length * lineH + 16;
      this.ctx.textAlign = 'center';
      this.ctx.font = CANVAS_FONTS.helpSectionTitle;
      this.ctx.fillStyle = field.color;
      this.ctx.fillText(`Field: ${field.name}`, W / 2, fieldY);

      this.ctx.font = CANVAS_FONTS.helpItemDesc;
      this.ctx.fillStyle = '#999';
      const traits: string[] = [];
      if (field.obstacles.length > 0) traits.push(`${field.obstacles.length} obstacles`);
      if (field.destructible) traits.push('destructible');
      if (field.goalSize >= 150) traits.push('wide goal');
      if (field.goalSize <= 110) traits.push('narrow goal');
      if (traits.length === 0) traits.push('standard');
      this.ctx.fillText(traits.join(' / '), W / 2, fieldY + 18);
    }

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#b4b4b4';
    this.ctx.font = CANVAS_FONTS.helpSubtitle;
    this.ctx.fillText(AH_STRINGS.game.tapToResume, W / 2, H - 20);
  }

  /** カウントダウン描画 */
  drawCountdown(countdownValue: number, elapsed: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    const text = countdownValue > 0 ? String(countdownValue) : AH_STRINGS.game.countdown('GO');
    const phaseProgress = (elapsed % 1000) / 1000;

    const scale = countdownValue > 0
      ? 1.5 - phaseProgress * 0.5
      : 1.0 + Math.sin(phaseProgress * Math.PI) * 0.5;

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.translate(W / 2, H / 2);
    this.ctx.scale(scale, scale);

    if (countdownValue > 0) {
      this.ctx.font = CANVAS_FONTS.countdownNumber;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#00d4ff';
      this.ctx.shadowBlur = 30;
    } else {
      this.ctx.font = CANVAS_FONTS.countdownGo;
      this.ctx.fillStyle = '#00ff88';
      this.ctx.shadowColor = '#00ff88';
      this.ctx.shadowBlur = 40;
    }

    this.ctx.fillText(text, 0, 0);
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  /** ポーズオーバーレイ描画 */
  drawPauseOverlay(): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, W, H);

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.font = CANVAS_FONTS.pauseTitle;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#00d4ff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(AH_STRINGS.game.paused, W / 2, H / 2 - 60);
    this.ctx.shadowBlur = 0;

    this.ctx.font = CANVAS_FONTS.pauseBody;
    this.ctx.fillStyle = '#00d4ff';
    this.ctx.fillText(AH_STRINGS.game.tapToResume, W / 2, H / 2 + 20);
    this.ctx.fillStyle = '#b4b4b4';
    this.ctx.font = CANVAS_FONTS.pauseHint;
    this.ctx.fillText('Press ESC or P to toggle', W / 2, H / 2 + 60);

    this.ctx.restore();
  }

  /** ゲームパッド接続/切断トースト描画 */
  drawToast(toast: GamepadToast | undefined, now: number): void {
    const { WIDTH, HEIGHT } = this.consts.CANVAS;
    drawToastOnCanvas(this.ctx, toast, now, WIDTH, HEIGHT);
  }

  /** コンボ表示描画 */
  drawCombo(combo: ComboState, now: number): void {
    if (combo.count < 2) return;
    const { WIDTH: W } = this.consts.CANVAS;

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let color = '#ffdd00';
    if (combo.count >= 5) {
      const hue = (now * 0.3) % 360;
      color = `hsl(${hue}, 100%, 60%)`;
    } else if (combo.count >= 3) {
      color = '#ff6600';
    }

    const scale = 1 + Math.sin(now * 0.01) * 0.1;
    this.ctx.font = CANVAS_FONTS.combo(scale);
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15;
    this.ctx.fillText(`x${combo.count} COMBO!`, W / 2, 60);
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }
}
