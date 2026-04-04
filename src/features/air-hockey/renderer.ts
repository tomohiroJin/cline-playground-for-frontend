import { CONSTANTS, GameConstants } from './core/constants';
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
  ComboState,
  HitStopState,
} from './core/types';
import type { GamepadToast } from './hooks/useGamepadInput';
import { drawToastOnCanvas } from './infrastructure/renderer/ui-renderer';
import { magnitude } from '../../utils/math-utils';
import {
  lightenColor as _lightenColor,
  darkenColor as _darkenColor,
  getPuckColorBySpeed,
  getTrailLengthBySpeed,
  SPEED_NORMAL,
  SPEED_FAST,
} from './infrastructure/renderer/renderer-utils';

// 後方互換のため re-export
export const lightenColor = _lightenColor;
export const darkenColor = _darkenColor;

/** 基準解像度（フォントサイズ・レイアウトオフセットのスケール基準） */
const BASE_WIDTH = 450;

/** 描画スケール係数を算出（Canvas 幅 / 基準幅） */
const getDrawScale = (consts: GameConstants) => consts.CANVAS.WIDTH / BASE_WIDTH;

// Renderer モジュール - 描画責務のみ
export const Renderer = {
  // 背景グラデーション（静的）
  clear(ctx: CanvasRenderingContext2D, consts: GameConstants = CONSTANTS, _now = 0) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgb(18, 22, 28)');
    grad.addColorStop(1, 'rgb(8, 12, 18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  },
  // フィールドラインネオン強化（US-1.1: 台の質感向上）
  drawField(ctx: CanvasRenderingContext2D, field: FieldConfig, consts: GameConstants = CONSTANTS, obstacleStates: ObstacleState[] = [], now = 0) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const s = getDrawScale(consts);

    // P1-02: 外枠（木目風グラデーション + 多重線）
    const frameGrad = ctx.createLinearGradient(0, 0, W, H);
    frameGrad.addColorStop(0, '#2a1810');
    frameGrad.addColorStop(0.5, '#3d2518');
    frameGrad.addColorStop(1, '#1a0e08');
    ctx.strokeStyle = frameGrad;
    const frameW = Math.round(12 * s);
    const frameOuter = Math.round(6 * s);
    const frameInner = Math.round(12 * s);
    ctx.lineWidth = frameW;
    ctx.strokeRect(frameOuter, frameOuter, W - frameOuter * 2, H - frameOuter * 2);

    // 内枠（光沢ハイライト）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(frameInner, frameInner, W - frameInner * 2, H - frameInner * 2);

    // フィールドカラーのネオン枠線
    ctx.strokeStyle = field.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = field.color;
    ctx.shadowBlur = Math.round(15 * s);
    ctx.strokeRect(frameInner, frameInner, W - frameInner * 2, H - frameInner * 2);
    ctx.shadowBlur = 0;

    // P1-03: フィールド面の照明効果（放射グラデーション）
    const lightGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.6);
    lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    lightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.015)');
    lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(frameInner, frameInner, W - frameInner * 2, H - frameInner * 2);

    // P1-04: 中央ライン（二重線 + 装飾）
    const lineMargin = Math.round(15 * s);
    const lineGap = Math.round(3 * s);
    ctx.strokeStyle = field.color + '33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineMargin, H / 2);
    ctx.lineTo(W - lineMargin, H / 2);
    ctx.stroke();

    ctx.strokeStyle = field.color + '66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lineMargin, H / 2 - lineGap);
    ctx.lineTo(W - lineMargin, H / 2 - lineGap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lineMargin, H / 2 + lineGap);
    ctx.lineTo(W - lineMargin, H / 2 + lineGap);
    ctx.stroke();

    // 中央円（装飾 + ネオングロー）
    const centerCircleR = Math.round(60 * s);
    const centerDotR = Math.round(8 * s);
    ctx.shadowColor = field.color;
    ctx.shadowBlur = Math.round(15 * s);
    ctx.strokeStyle = field.color + '55';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, centerCircleR, 0, Math.PI * 2);
    ctx.stroke();
    // 内側の小円
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, centerDotR, 0, Math.PI * 2);
    ctx.fillStyle = field.color + '44';
    ctx.fill();
    ctx.shadowBlur = 0;

    // P1-05: ゴールエリア（LED風発光）
    const gs = field.goalSize;
    const ledH = Math.round(6 * s);
    const ledSpacing = Math.round(12 * s);
    const drawGoalLED = (y: number, color: string, glowColor: string) => {
      const gx = W / 2 - gs / 2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = Math.round(25 * s);
      ctx.fillStyle = color;
      ctx.fillRect(gx, y, gs, ledH);
      // LED 粒感ドット
      ctx.shadowBlur = 0;
      const dotCount = Math.floor(gs / ledSpacing);
      for (let i = 0; i < dotCount; i++) {
        const dx = gx + ledSpacing / 2 + i * ledSpacing;
        ctx.beginPath();
        ctx.arc(dx, y + ledH / 2, Math.round(2 * s), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
      }
    };
    drawGoalLED(0, '#ff3333', '#ff0000');
    drawGoalLED(H - ledH, '#33ffff', '#00ffff');
    field.obstacles.forEach((ob: Obstacle, i: number) => {
      const obState = obstacleStates[i];

      // 破壊済みの障害物: 復活間近で点滅表示
      if (obState?.destroyed) {
        const respawnMs = field.obstacleRespawnMs ?? consts.TIMING.OBSTACLE_RESPAWN;
        const elapsed = now - obState.destroyedAt;
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

      const hpRatio = obState ? obState.hp / obState.maxHp : 1;
      // HP に応じてサイズ変化（0.5〜1.0）
      const sizeScale = 0.5 + 0.5 * hpRatio;
      const drawR = ob.r * sizeScale;

      // HP に応じた色変化
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
      ctx.arc(ob.x, ob.y, drawR, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  },
  drawEffectZones(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number, consts: GameConstants = CONSTANTS) {
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
  // マレット立体感描画（US-1.2: 平たい円盤＋中央グリップ）
  drawMallet(ctx: CanvasRenderingContext2D, mallet: Mallet, color: string, hasGlow: boolean, consts: GameConstants = CONSTANTS, sizeScale = 1) {
    const r = consts.SIZES.MALLET * sizeScale;
    const { x, y } = mallet;

    // 1. ドロップシャドウ（円盤は平たいので円形に近い影）
    ctx.beginPath();
    ctx.arc(x + 1, y + 3, r * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();

    // 2. 本体ディスク（外縁だけ暗くなるフラットなグラデーション）
    const diskGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    diskGrad.addColorStop(0, lightenColor(color, 20));
    diskGrad.addColorStop(0.75, color);
    diskGrad.addColorStop(0.92, darkenColor(color, 30));
    diskGrad.addColorStop(1, darkenColor(color, 60));

    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = diskGrad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. 外周リング（白い縁 = マレットの厚み感）
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. 外周の暗いエッジ（側面の影）
    ctx.beginPath();
    ctx.arc(x, y, r + 1, 0, Math.PI * 2);
    ctx.strokeStyle = darkenColor(color, 50);
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. 上面のハイライト（広い弧で平面感を表現）
    ctx.beginPath();
    ctx.arc(x, y - r * 0.15, r * 0.6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 6. 中央グリップ（ノブ）
    const gripR = r * 0.38;
    const gripGrad = ctx.createRadialGradient(x, y, 0, x, y, gripR);
    gripGrad.addColorStop(0, '#ffffff');
    gripGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gripGrad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
    ctx.beginPath();
    ctx.arc(x, y, gripR, 0, Math.PI * 2);
    ctx.fillStyle = gripGrad;
    ctx.fill();
    // グリップの縁
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 7. グロー（速度エフェクト時）
    if (hasGlow) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  },
  // パックトレイル（速度対応）
  drawPuckTrail(ctx: CanvasRenderingContext2D, puck: Puck, consts: GameConstants = CONSTANTS) {
    const { PUCK: BR } = consts.SIZES;
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
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fillStyle = puckColor.replace('#', '');
      // 色をrgba変換
      const r = parseInt(puckColor.slice(1, 3), 16);
      const g = parseInt(puckColor.slice(3, 5), 16);
      const b = parseInt(puckColor.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }
  },
  // スピードライン描画（超高速時）
  drawSpeedLines(ctx: CanvasRenderingContext2D, puck: Puck) {
    const speed = magnitude(puck.vx, puck.vy);
    if (speed <= SPEED_FAST || !puck.visible) return;

    ctx.save();
    const angle = Math.atan2(puck.vy, puck.vx);
    const lineCount = 5;
    for (let i = 0; i < lineCount; i++) {
      const offset = (i - lineCount / 2) * 8;
      const startX = puck.x - Math.cos(angle) * 30 + Math.sin(angle) * offset;
      const startY = puck.y - Math.sin(angle) * 30 - Math.cos(angle) * offset;
      const endX = startX - Math.cos(angle) * 20;
      const endY = startY - Math.sin(angle) * 20;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = `rgba(255, 68, 68, ${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  },
  // パック金属質感描画（US-1.3）
  drawPuck(ctx: CanvasRenderingContext2D, puck: Puck, consts: GameConstants = CONSTANTS) {
    if (!puck.visible) return;
    const r = consts.SIZES.PUCK;
    const speed = magnitude(puck.vx, puck.vy);
    const color = getPuckColorBySpeed(speed);

    this.drawPuckTrail(ctx, puck, consts);
    this.drawSpeedLines(ctx, puck);

    // 1. ドロップシャドウ
    ctx.beginPath();
    ctx.ellipse(puck.x + 1, puck.y + 2, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();

    // 2. 本体（メタリックグラデーション）
    const baseColor = color === '#ffffff' ? '#cccccc' : color;
    const darkBaseColor = color === '#ffffff' ? '#999999' : color;
    const metalGrad = ctx.createRadialGradient(
      puck.x - r * 0.2, puck.y - r * 0.2, r * 0.05,
      puck.x, puck.y, r
    );
    metalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    metalGrad.addColorStop(0.3, color);
    metalGrad.addColorStop(0.8, darkenColor(baseColor, 30));
    metalGrad.addColorStop(1, darkenColor(darkBaseColor, 60));

    // 速度グロー
    if (speed > SPEED_NORMAL) {
      ctx.shadowColor = color;
      ctx.shadowBlur = speed > SPEED_FAST ? 25 : 12;
    }

    ctx.beginPath();
    ctx.arc(puck.x, puck.y, r, 0, Math.PI * 2);
    ctx.fillStyle = metalGrad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. エッジリング
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. ハイライト
    ctx.beginPath();
    ctx.arc(puck.x - r * 0.25, puck.y - r * 0.25, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
  },
  drawItem(ctx: CanvasRenderingContext2D, item: Item, now: number, consts: GameConstants = CONSTANTS) {
    const { ITEM: IR } = consts.SIZES;
    const pulse = 1 + Math.sin(now * 0.008) * 0.2;
    this.drawCircle(ctx, item.x, item.y, IR * pulse, item.color);
    ctx.fillStyle = '#fff';
    const s2 = getDrawScale(consts);
    ctx.font = `bold ${Math.round(14 * s2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);
  },
  drawHUD(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number, consts: GameConstants = CONSTANTS) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const s = getDrawScale(consts);
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(12 * s)}px Arial`;
    const playerEff = effects.player;
    if (playerEff.speed && now - playerEff.speed.start < playerEff.speed.duration) {
      const remaining = Math.ceil(
        (playerEff.speed.duration - (now - playerEff.speed.start)) / 1000
      );
      ctx.fillStyle = '#00ffff';
      ctx.fillText(`⚡${remaining}s`, W / 2, H - Math.round(25 * s));
    }
    if (playerEff.invisible > 0) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillText(`👻x${playerEff.invisible}`, W / 2, H - Math.round(45 * s));
    }
  },
  drawFlash(
    ctx: CanvasRenderingContext2D,
    flash: { type: string; time: number } | null,
    now: number,
    consts: GameConstants = CONSTANTS
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
      const s = getDrawScale(consts);
      ctx.font = `bold ${Math.round(18 * s)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(`${item.icon} ${item.name}!`, W / 2, H / 2);
    }
  },
  drawGoalEffect(ctx: CanvasRenderingContext2D, effect: GoalEffect | null, now: number, consts: GameConstants = CONSTANTS) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    if (!effect) return;
    const elapsed = now - effect.time;
    if (elapsed >= consts.TIMING.GOAL_EFFECT) return;
    const isPlayerGoal = effect.scorer === 'cpu';
    const alpha = Math.max(0, 0.5 - elapsed / 1000);
    ctx.fillStyle = isPlayerGoal ? `rgba(0,255,255,${alpha})` : `rgba(255,0,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    const s = getDrawScale(consts);
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(36 * s)}px Arial`;
    const textY = H / 2 + Math.sin(elapsed * 0.01) * Math.round(10 * s);
    ctx.fillStyle = isPlayerGoal ? '#00ffff' : '#ff4444';
    ctx.shadowColor = isPlayerGoal ? '#00ffff' : '#ff0000';
    ctx.shadowBlur = Math.round(20 * s);
    ctx.fillText(isPlayerGoal ? 'GOAL!' : 'LOSE...', W / 2, textY);
    ctx.font = `bold ${Math.round(20 * s)}px Arial`;
    ctx.fillText(isPlayerGoal ? '🎉 +1 Pt!' : '😢 -1 Pt', W / 2, textY + Math.round(40 * s));
    ctx.shadowBlur = 0;
  },
  drawHelp(ctx: CanvasRenderingContext2D, consts: GameConstants = CONSTANTS, field?: FieldConfig) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const s = getDrawScale(consts);
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    // タイトル
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(18 * s)}px Arial`;
    ctx.fillText('How to Play', W / 2, Math.round(36 * s));

    ctx.font = `${Math.round(12 * s)}px Arial`;
    ctx.fillStyle = '#ccc';
    ctx.fillText('Hit the puck into the opponent\'s goal!', W / 2, Math.round(58 * s));

    // アイテム一覧
    ctx.font = `bold ${Math.round(14 * s)}px Arial`;
    ctx.fillStyle = 'var(--accent-color, #00d4ff)';
    ctx.fillText('-- Items --', W / 2, Math.round(86 * s));

    const items = [
      { icon: '◆', name: 'Split', color: '#FF6B6B', desc: 'Puck splits into 3' },
      { icon: '⚡', name: 'Speed', color: '#4ECDC4', desc: 'Speed zone on your side' },
      { icon: '👻', name: 'Hide', color: '#9B59B6', desc: 'Puck turns invisible' },
      { icon: '🛡', name: 'Shield', color: '#FFD700', desc: 'Blocks one goal' },
      { icon: '🧲', name: 'Magnet', color: '#FF6B35', desc: 'Attracts puck to mallet' },
      { icon: '⬆', name: 'Big', color: '#00FF88', desc: 'Mallet size up' },
    ];

    const startY = Math.round(108 * s);
    const lineH = Math.round(28 * s);
    ctx.textAlign = 'left';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const y = startY + i * lineH;
      // アイコン + 名前
      ctx.font = `bold ${Math.round(13 * s)}px Arial`;
      ctx.fillStyle = item.color;
      ctx.fillText(`${item.icon} ${item.name}`, Math.round(30 * s), y);
      // 説明
      ctx.font = `${Math.round(11 * s)}px Arial`;
      ctx.fillStyle = '#aaa';
      ctx.fillText(item.desc, Math.round(150 * s), y);
    }

    // フィールド情報
    if (field) {
      const fieldY = startY + items.length * lineH + Math.round(16 * s);
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.round(14 * s)}px Arial`;
      ctx.fillStyle = field.color;
      ctx.fillText(`Field: ${field.name}`, W / 2, fieldY);

      ctx.font = `${Math.round(11 * s)}px Arial`;
      ctx.fillStyle = '#999';
      const traits: string[] = [];
      if (field.obstacles.length > 0) traits.push(`${field.obstacles.length} obstacles`);
      if (field.destructible) traits.push('destructible');
      if (field.goalSize >= 200) traits.push('wide goal');
      if (field.goalSize <= 150) traits.push('narrow goal');
      if (traits.length === 0) traits.push('standard');
      ctx.fillText(traits.join(' / '), W / 2, fieldY + Math.round(18 * s));
    }

    // フッタ
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.font = `${Math.round(12 * s)}px Arial`;
    ctx.fillText('Tap to Resume', W / 2, H - Math.round(20 * s));
  },
  drawFeverEffect(ctx: CanvasRenderingContext2D, active: boolean, now: number, consts: GameConstants = CONSTANTS) {
    if (!active) return;
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const hue = (now * 0.1) % 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.05)`;
    ctx.fillRect(0, 0, W, H);
    const s = getDrawScale(consts);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(24 * s)}px Arial`;
    const textHue = (now * 0.2) % 360;
    ctx.fillStyle = `hsl(${textHue}, 100%, 60%)`;
    ctx.shadowColor = `hsl(${textHue}, 100%, 50%)`;
    ctx.shadowBlur = Math.round(15 * s);
    const bounce = Math.sin(now * 0.005) * Math.round(5 * s);
    ctx.fillText('FEVER TIME!', W / 2, Math.round(30 * s) + bounce);
    ctx.shadowBlur = 0;
    ctx.restore();
  },
  // ゴールパーティクル描画
  drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    if (particles.length === 0) return;
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
      ctx.fill();
    }
  },
  // カウントダウン描画
  drawCountdown(ctx: CanvasRenderingContext2D, countdownValue: number, elapsed: number, consts: GameConstants = CONSTANTS) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const text = countdownValue > 0 ? String(countdownValue) : 'GO!';
    const phaseProgress = (elapsed % 1000) / 1000;

    // スケールアニメーション: 拡大→縮小
    const scale = countdownValue > 0
      ? 1.5 - phaseProgress * 0.5
      : 1.0 + Math.sin(phaseProgress * Math.PI) * 0.5;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);

    const s = getDrawScale(consts);
    if (countdownValue > 0) {
      // 数字: 白色
      ctx.font = `bold ${Math.round(80 * s)}px Arial`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = Math.round(30 * s);
    } else {
      // GO!: ネオンカラー
      ctx.font = `bold ${Math.round(90 * s)}px Arial`;
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = Math.round(40 * s);
    }

    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  },
  // ポーズオーバーレイ描画
  drawPauseOverlay(ctx: CanvasRenderingContext2D, consts: GameConstants = CONSTANTS) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // PAUSED テキスト
    const s = getDrawScale(consts);
    ctx.font = `bold ${Math.round(48 * s)}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = Math.round(20 * s);
    ctx.fillText('PAUSED', W / 2, H / 2 - Math.round(60 * s));
    ctx.shadowBlur = 0;

    // メニューオプション
    ctx.font = `bold ${Math.round(20 * s)}px Arial`;
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('Tap to Resume', W / 2, H / 2 + Math.round(20 * s));
    ctx.fillStyle = '#888888';
    ctx.font = `${Math.round(16 * s)}px Arial`;
    ctx.fillText('Press ESC or P to toggle', W / 2, H / 2 + Math.round(60 * s));

    ctx.restore();
  },
  // コンボ表示描画
  drawCombo(ctx: CanvasRenderingContext2D, combo: ComboState, now: number, consts: GameConstants = CONSTANTS) {
    if (combo.count < 2) return;
    const { WIDTH: W } = consts.CANVAS;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // コンボ数に応じた色
    let color = '#ffdd00';
    if (combo.count >= 5) {
      // レインボー
      const hue = (now * 0.3) % 360;
      color = `hsl(${hue}, 100%, 60%)`;
    } else if (combo.count >= 3) {
      color = '#ff6600';
    }

    const s = getDrawScale(consts);
    const scale = 1 + Math.sin(now * 0.01) * 0.1;
    ctx.font = `bold ${Math.floor(28 * s * scale)}px Arial`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.round(15 * s);
    ctx.fillText(`x${combo.count} COMBO!`, W / 2, Math.round(60 * s));
    ctx.shadowBlur = 0;

    ctx.restore();
  },
  // シールドバリア描画
  drawShield(ctx: CanvasRenderingContext2D, isPlayer: boolean, goalSize: number, consts: GameConstants = CONSTANTS) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const y = isPlayer ? H - 8 : 8;

    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(W / 2 - goalSize / 2, y);
    ctx.lineTo(W / 2 + goalSize / 2, y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  },
  // マグネットエフェクト描画
  drawMagnetEffect(ctx: CanvasRenderingContext2D, mallet: Mallet, now: number) {
    ctx.save();
    const pulse = 1 + Math.sin(now * 0.008) * 0.3;
    const radius = 80 * pulse;
    ctx.beginPath();
    ctx.arc(mallet.x, mallet.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },
  // 衝撃波描画（US-1.4: ヒットストップ演出）
  drawShockwave(ctx: CanvasRenderingContext2D, hitStop: HitStopState) {
    if (!hitStop.active) return;
    const { impactX, impactY, shockwaveRadius, shockwaveMaxRadius } = hitStop;
    const alpha = 1 - shockwaveRadius / shockwaveMaxRadius;

    ctx.beginPath();
    ctx.arc(impactX, impactY, shockwaveRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 内側の薄い円
    ctx.beginPath();
    ctx.arc(impactX, impactY, shockwaveRadius * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  },

  // ビネット効果描画（US-1.5: ゴールスローモーション演出）
  drawVignette(ctx: CanvasRenderingContext2D, consts: GameConstants = CONSTANTS, intensity = 0.5) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  },

  // リアクション吹き出し描画（US-2.1: ゴール時のキャラクターリアクション）
  drawReaction(
    ctx: CanvasRenderingContext2D,
    text: string,
    side: 'player' | 'cpu',
    consts: GameConstants = CONSTANTS,
    elapsed: number
  ) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    // 1.5秒かけてフェードアウト
    const REACTION_DURATION = 1500;
    const alpha = Math.max(0, 1 - elapsed / REACTION_DURATION);
    if (alpha <= 0) return;

    const x = W * 0.7;
    const y = side === 'cpu' ? H * 0.15 : H * 0.85;

    const s = getDrawScale(consts);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(14 * s)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 吹き出し背景のサイズ計算
    const metrics = ctx.measureText(text);
    const padding = Math.round(12 * s);
    const bw = metrics.width + padding * 2;
    const bh = Math.round(32 * s);
    const rx = x - bw / 2;
    const ry = y - bh / 2;

    // 角丸背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(rx, ry, bw, bh, 8);
    ctx.fill();

    // 枠線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // テキスト
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);

    ctx.restore();
  },

  /** ゲームパッド接続/切断トースト描画（drawToastOnCanvas に委譲） */
  drawToast(ctx: CanvasRenderingContext2D, toast: GamepadToast | undefined, now: number) {
    const { WIDTH, HEIGHT } = CONSTANTS.CANVAS;
    drawToastOnCanvas(ctx, toast, now, WIDTH, HEIGHT);
  },

  // 試合統計をリザルト画面用にフォーマット
  formatStats(stats: { playerHits: number; cpuHits: number; maxPuckSpeed: number; playerSaves: number; cpuSaves: number; matchDuration: number }) {
    const minutes = Math.floor(stats.matchDuration / 60000);
    const seconds = Math.floor((stats.matchDuration % 60000) / 1000);
    return {
      time: `${minutes}:${String(seconds).padStart(2, '0')}`,
      maxSpeed: stats.maxPuckSpeed.toFixed(1),
    };
  },
};
