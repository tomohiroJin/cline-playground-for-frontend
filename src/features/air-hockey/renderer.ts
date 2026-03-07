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
} from './core/types';
import { magnitude } from '../../utils/math-utils';

// パック速度の閾値定数
const SPEED_NORMAL = 6;
const SPEED_FAST = 10;

// 速度に応じたパックの色を取得
const getPuckColorBySpeed = (speed: number): string => {
  if (speed > SPEED_FAST) return '#ff4444';
  if (speed > SPEED_NORMAL) return '#ffdd00';
  return '#ffffff';
};

// 速度に応じたトレイル長を取得
const getTrailLengthBySpeed = (speed: number): number => {
  if (speed > SPEED_FAST) return 16;
  if (speed > SPEED_NORMAL) return 12;
  return 8;
};

// Renderer モジュール - 描画責務のみ
export const Renderer = {
  // 背景グラデーションアニメーション
  clear(ctx: CanvasRenderingContext2D, consts: GameConstants = CONSTANTS, now = 0) {
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
  // フィールドラインネオン強化
  drawField(ctx: CanvasRenderingContext2D, field: FieldConfig, consts: GameConstants = CONSTANTS, obstacleStates: ObstacleState[] = [], now = 0) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
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
    ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
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
  // マレットグロー強化（サイズスケール対応）
  drawMallet(ctx: CanvasRenderingContext2D, mallet: Mallet, color: string, hasGlow: boolean, consts: GameConstants = CONSTANTS, sizeScale = 1) {
    const { MALLET: MR } = consts.SIZES;
    const drawRadius = MR * sizeScale;
    // 常時弱いグロー
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    if (hasGlow) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 25;
    }
    this.drawCircle(ctx, mallet.x, mallet.y, drawRadius, color, '#fff', 3);
    ctx.shadowBlur = 0;
    this.drawCircle(ctx, mallet.x, mallet.y, 8, '#fff');
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
  drawPuck(ctx: CanvasRenderingContext2D, puck: Puck, consts: GameConstants = CONSTANTS) {
    const { PUCK: BR } = consts.SIZES;
    if (!puck.visible) return;

    const speed = magnitude(puck.vx, puck.vy);
    const puckColor = getPuckColorBySpeed(speed);

    this.drawPuckTrail(ctx, puck, consts);
    this.drawSpeedLines(ctx, puck);

    // 高速時のグロー効果
    if (speed > SPEED_NORMAL) {
      ctx.shadowColor = puckColor;
      ctx.shadowBlur = speed > SPEED_FAST ? 20 : 10;
    }

    this.drawCircle(ctx, puck.x, puck.y, BR, puckColor, '#888', 2);
    ctx.shadowBlur = 0;
  },
  drawItem(ctx: CanvasRenderingContext2D, item: Item, now: number, consts: GameConstants = CONSTANTS) {
    const { ITEM: IR } = consts.SIZES;
    const pulse = 1 + Math.sin(now * 0.008) * 0.2;
    this.drawCircle(ctx, item.x, item.y, IR * pulse, item.color);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);
  },
  drawHUD(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number, consts: GameConstants = CONSTANTS) {
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
      ctx.font = 'bold 18px Arial';
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
  drawHelp(ctx: CanvasRenderingContext2D, consts: GameConstants = CONSTANTS, field?: FieldConfig) {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    // タイトル
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('How to Play', W / 2, 36);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Hit the puck into the opponent\'s goal!', W / 2, 58);

    // アイテム一覧
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'var(--accent-color, #00d4ff)';
    ctx.fillText('-- Items --', W / 2, 86);

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
    ctx.textAlign = 'left';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const y = startY + i * lineH;
      // アイコン + 名前
      ctx.font = 'bold 13px Arial';
      ctx.fillStyle = item.color;
      ctx.fillText(`${item.icon} ${item.name}`, 30, y);
      // 説明
      ctx.font = '11px Arial';
      ctx.fillStyle = '#aaa';
      ctx.fillText(item.desc, 150, y);
    }

    // フィールド情報
    if (field) {
      const fieldY = startY + items.length * lineH + 16;
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = field.color;
      ctx.fillText(`Field: ${field.name}`, W / 2, fieldY);

      ctx.font = '11px Arial';
      ctx.fillStyle = '#999';
      const traits: string[] = [];
      if (field.obstacles.length > 0) traits.push(`${field.obstacles.length} obstacles`);
      if (field.destructible) traits.push('destructible');
      if (field.goalSize >= 150) traits.push('wide goal');
      if (field.goalSize <= 110) traits.push('narrow goal');
      if (traits.length === 0) traits.push('standard');
      ctx.fillText(traits.join(' / '), W / 2, fieldY + 18);
    }

    // フッタ
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.fillText('Tap to Resume', W / 2, H - 20);
  },
  drawFeverEffect(ctx: CanvasRenderingContext2D, active: boolean, now: number, consts: GameConstants = CONSTANTS) {
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
  // ゴールパーティクル描画
  drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
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

    if (countdownValue > 0) {
      // 数字: 白色
      ctx.font = 'bold 80px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 30;
    } else {
      // GO!: ネオンカラー
      ctx.font = 'bold 90px Arial';
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 40;
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
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 20;
    ctx.fillText('PAUSED', W / 2, H / 2 - 60);
    ctx.shadowBlur = 0;

    // メニューオプション
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('Tap to Resume', W / 2, H / 2 + 20);
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('Press ESC or P to toggle', W / 2, H / 2 + 60);

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

    const scale = 1 + Math.sin(now * 0.01) * 0.1;
    ctx.font = `bold ${Math.floor(28 * scale)}px Arial`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillText(`x${combo.count} COMBO!`, W / 2, 60);
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
    const radius = 60 * pulse;
    ctx.beginPath();
    ctx.arc(mallet.x, mallet.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
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
