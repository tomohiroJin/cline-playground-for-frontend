/**
 * UI レンダラー
 * - カウントダウン・スコア・HUD・ポーズ・コンボ・ヘルプ画面の描画
 */
import type { GameEffects, FieldConfig, ComboState } from '../../domain/types';
import type { GameConstants } from '../../core/constants';
import type { GamepadToast } from '../../hooks/useGamepadInput';

/** トースト表示時間（ms） */
const TOAST_DURATION = 3000;
/** フェードアウト時間（ms） */
const FADE_DURATION = 500;
/** Canvas フォント（絵文字フォールバック含む） */
const TOAST_FONT = "bold 14px 'Arial', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
/** トーストのパディング */
const TOAST_PADDING_X = 20;
const TOAST_PADDING_Y = 10;
/** トースト Y 座標オフセット（Canvas 下端からの距離） */
const TOAST_OFFSET_Y = 100;
/** 接続時の背景色（緑系） */
const TOAST_BG_CONNECT = 'rgba(0, 128, 0, 0.8)';
/** 切断時の背景色（赤系） */
const TOAST_BG_DISCONNECT = 'rgba(128, 0, 0, 0.8)';
/** トーストの角丸半径 */
const TOAST_BORDER_RADIUS = 8;

export class UiRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly consts: GameConstants
  ) {}

  /** HUD 描画（エフェクト残り時間） */
  drawHUD(effects: GameEffects, now: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 12px Arial';
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
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText('How to Play', W / 2, 36);

    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#ccc';
    this.ctx.fillText('Hit the puck into the opponent\'s goal!', W / 2, 58);

    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillStyle = 'var(--accent-color, #00d4ff)';
    this.ctx.fillText('-- Items --', W / 2, 86);

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
      this.ctx.font = 'bold 13px Arial';
      this.ctx.fillStyle = item.color;
      this.ctx.fillText(`${item.icon} ${item.name}`, 30, y);
      this.ctx.font = '11px Arial';
      this.ctx.fillStyle = '#aaa';
      this.ctx.fillText(item.desc, 150, y);
    }

    if (field) {
      const fieldY = startY + items.length * lineH + 16;
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillStyle = field.color;
      this.ctx.fillText(`Field: ${field.name}`, W / 2, fieldY);

      this.ctx.font = '11px Arial';
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
    this.ctx.fillStyle = '#888';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('Tap to Resume', W / 2, H - 20);
  }

  /** カウントダウン描画 */
  drawCountdown(countdownValue: number, elapsed: number): void {
    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;
    const text = countdownValue > 0 ? String(countdownValue) : 'GO!';
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
      this.ctx.font = 'bold 80px Arial';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#00d4ff';
      this.ctx.shadowBlur = 30;
    } else {
      this.ctx.font = 'bold 90px Arial';
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

    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#00d4ff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('PAUSED', W / 2, H / 2 - 60);
    this.ctx.shadowBlur = 0;

    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = '#00d4ff';
    this.ctx.fillText('Tap to Resume', W / 2, H / 2 + 20);
    this.ctx.fillStyle = '#888888';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Press ESC or P to toggle', W / 2, H / 2 + 60);

    this.ctx.restore();
  }

  /** ゲームパッド接続/切断トースト描画 */
  drawToast(toast: GamepadToast | undefined, now: number): void {
    if (!toast) return;

    const elapsed = now - toast.timestamp;
    if (elapsed >= TOAST_DURATION) return;

    const { WIDTH: W, HEIGHT: H } = this.consts.CANVAS;

    // フェードアウト計算
    const fadeStart = TOAST_DURATION - FADE_DURATION;
    const opacity = elapsed < fadeStart
      ? 1.0
      : 1.0 - (elapsed - fadeStart) / FADE_DURATION;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    // 接続/切断で背景色を切り替え
    const isDisconnect = toast.message.includes('切断');
    this.ctx.fillStyle = isDisconnect ? TOAST_BG_DISCONNECT : TOAST_BG_CONNECT;

    // テキスト幅を計測して背景サイズを算出
    this.ctx.font = TOAST_FONT;
    const textWidth = this.ctx.measureText(toast.message).width;
    const bgWidth = textWidth + TOAST_PADDING_X * 2;
    const bgHeight = 14 + TOAST_PADDING_Y * 2;
    const bgX = (W - bgWidth) / 2;
    const bgY = H - TOAST_OFFSET_Y - bgHeight / 2;

    // 角丸矩形背景
    this.ctx.beginPath();
    this.ctx.roundRect(bgX, bgY, bgWidth, bgHeight, TOAST_BORDER_RADIUS);
    this.ctx.fill();

    // テキスト描画
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(toast.message, W / 2, bgY + bgHeight / 2);

    this.ctx.restore();
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
    this.ctx.font = `bold ${Math.floor(28 * scale)}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15;
    this.ctx.fillText(`x${combo.count} COMBO!`, W / 2, 60);
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }
}
