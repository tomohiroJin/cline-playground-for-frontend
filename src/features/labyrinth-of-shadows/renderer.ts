import { CONFIG, CONTENT } from './constants';
import type { GameState, Sprite, EntityType } from './types';
import { clamp, distance, normAngle, toHex } from './utils';
import { MazeService } from './maze-service';

// レンガパターンの色を計算
const getBrickColor = (hitX: number, hitY: number, shade: number): [number, number, number] => {
  // レンガの繰り返しパターン
  const brickW = 0.5, brickH = 0.25;
  const row = Math.floor(hitY / brickH);
  const offset = (row % 2) * brickW * 0.5;
  const bx = (hitX + offset) % brickW;
  const by = hitY % brickH;

  // 目地（モルタル）の判定
  const mortarW = 0.03;
  const isMortar = bx < mortarW || by < mortarW;

  if (isMortar) {
    return [
      Math.floor(35 * shade),
      Math.floor(30 * shade),
      Math.floor(28 * shade),
    ];
  }

  // レンガ本体の色バリエーション
  const noise = Math.sin(hitX * 13.7 + hitY * 7.3) * 0.5 + 0.5;
  const r = (70 + noise * 20) * shade;
  const g = (38 + noise * 10) * shade;
  const b = (45 + noise * 12) * shade;
  return [Math.floor(r), Math.floor(g), Math.floor(b)];
};

// ==================== RENDERER ====================
export const Renderer = {
  drawBackground(
    ctx: CanvasRenderingContext2D,
    g: GameState,
    W: number,
    H: number,
    danger: number
  ) {
    const r = Math.floor(8 + danger * 22),
      gr = Math.floor(8 - danger * 3),
      b = Math.floor(26 - danger * 11);
    ctx.fillStyle = g.hiding ? '#010106' : `rgb(${r},${gr},${b})`;
    ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = g.hiding ? '#080812' : '#181828';
    ctx.fillRect(0, H / 2, W, H / 2);
  },

  drawWalls(ctx: CanvasRenderingContext2D, g: GameState, W: number, H: number, torchFlicker: number) {
    const { fov, rayCount, maxDepth } = CONFIG.render;
    const zBuf = [];

    for (let i = 0; i < rayCount; i++) {
      const ang = g.player.angle - fov / 2 + (i / rayCount) * fov;
      const cos = Math.cos(ang),
        sin = Math.sin(ang);
      let d = 0,
        hitX = 0,
        hitY = 0;

      while (d < maxDepth) {
        d += 0.04;
        hitX = g.player.x + cos * d;
        hitY = g.player.y + sin * d;
        if (!MazeService.isWalkable(g.maze, hitX, hitY)) break;
      }

      const corr = d * Math.cos(ang - g.player.angle);
      zBuf[i] = corr;
      const wH = Math.min(H * 1.8, H / corr);
      const shade = Math.max(0.05, 1 - corr / maxDepth);
      // トーチ照明の揺らぎ
      const flickerShade = shade * (0.92 + torchFlicker * 0.08);

      // プロシージャルレンガテクスチャ
      const [r, gr, b] = getBrickColor(hitX, hitY, flickerShade);

      ctx.fillStyle = `rgb(${r},${gr},${b})`;
      ctx.fillRect(
        Math.floor(i * (W / rayCount)),
        Math.floor((H - wH) / 2),
        Math.ceil(W / rayCount) + 1,
        Math.ceil(wH)
      );
    }
    return zBuf;
  },

  getSprites(g: GameState) {
    const sprites: Sprite[] = g.items
      .filter(i => !i.got)
      .map(i => ({
        x: i.x + 0.5,
        y: i.y + 0.5,
        type: i.type,
        ...CONTENT.items[i.type],
        sc: 1.2,
        glow: true,
        bob: true,
      }));

    const exitType: EntityType = g.keys >= g.reqKeys ? 'exit' : 'exitLocked';
    sprites.push({
      x: g.exit.x,
      y: g.exit.y,
      type: exitType,
      ...CONTENT.items[exitType],
      sc: 1.5,
      glow: g.keys >= g.reqKeys,
      pulse: g.keys >= g.reqKeys,
    });

    g.enemies
      .filter(e => e.active)
      .forEach(e => {
        const enemyVisual = e.type === 'wanderer'
          ? CONTENT.items.wanderer
          : e.type === 'teleporter'
            ? CONTENT.items.teleporter
            : CONTENT.items.enemy;

        sprites.push({
          x: e.x,
          y: e.y,
          type: e.type === 'wanderer' ? 'wanderer' : e.type === 'teleporter' ? 'teleporter' : 'enemy',
          ...enemyVisual,
          sc: 1.6,
          isEnemy: true,
          glow: true,
          pulse: e.type === 'teleporter',
        });
      });

    return sprites.sort(
      (a, b) =>
        distance(b.x, b.y, g.player.x, g.player.y) - distance(a.x, a.y, g.player.x, g.player.y)
    );
  },

  drawSprite(
    ctx: CanvasRenderingContext2D,
    g: GameState,
    s: Sprite,
    W: number,
    H: number,
    zBuf: number[],
    time: number
  ) {
    const { fov, rayCount, maxDepth } = CONFIG.render;
    const d = distance(g.player.x, g.player.y, s.x, s.y);

    if (d < 0.2 || d > maxDepth) return;
    if (!MazeService.hasLineOfSight(g.maze, g.player.x, g.player.y, s.x, s.y)) return;

    const ang = normAngle(Math.atan2(s.y - g.player.y, s.x - g.player.x) - g.player.angle);
    if (Math.abs(ang) > fov / 2 + 0.2) return;

    const sx = W / 2 - (ang / fov) * W;
    const ri = Math.floor((sx / W) * rayCount);
    if (ri >= 0 && ri < rayCount && zBuf[ri] < d * 0.92) return;

    let sz = Math.min(350, (H / d) * 0.8 * (s.sc ?? 1));
    const alpha = s.isEnemy
      ? clamp(1.2 - d / 8, 0.5, 1)
      : clamp(1.1 - d / maxDepth, 0.4, 1);
    const offsetY = s.bob ? Math.sin(time * 4) * 6 : 0;
    if (s.pulse) sz *= 1 + Math.sin(time * 5) * 0.06;

    if (sz > 18) {
      ctx.beginPath();
      ctx.arc(sx, H / 2 + offsetY, sz * 0.675, 0, Math.PI * 2);
      ctx.fillStyle = s.bgColor + toHex(alpha * 200);
      ctx.fill();
      ctx.strokeStyle = s.color + toHex(alpha * 200);
      ctx.lineWidth = Math.max(2, sz / 18);
      ctx.stroke();
    }

    if (s.glow && sz > 22) {
      const glow = ctx.createRadialGradient(sx, H / 2 + offsetY, 0, sx, H / 2 + offsetY, sz);
      glow.addColorStop(0, s.color + '55');
      glow.addColorStop(0.35, s.color + '25');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, H / 2 + offsetY, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = alpha;
    ctx.font = `${Math.floor(sz)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.emoji, sx, H / 2 + offsetY);

    if (d < 4.5 && sz > 32) {
      ctx.font = `bold ${Math.floor(clamp(sz / 3.5, 11, 22))}px sans-serif`;
      ctx.fillStyle = s.color;
      ctx.fillText(s.name, sx, H / 2 + offsetY + sz / 2 + 12);
    }
    ctx.globalAlpha = 1;
  },

  drawEffects(
    ctx: CanvasRenderingContext2D,
    g: GameState,
    W: number,
    H: number,
    danger: number,
    time: number
  ) {
    // 被ダメージフラッシュ
    if (g.invince > 2000) {
      ctx.fillStyle = `rgba(255,0,0,${(0.4 * (g.invince - 2000)) / 500})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 隠れ状態エフェクト
    if (g.hiding) {
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.6);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(0.6, 'rgba(0,0,40,0.55)');
      v.addColorStop(1, 'rgba(0,0,30,0.85)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(100,150,255,0.18)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🙈 息を潜めている...', W / 2, 42);
    }

    // 危険度表示
    if (danger > 0.45) {
      ctx.fillStyle = `rgba(255,0,0,${danger * (Math.sin(time * 8) * 0.5 + 0.5) * 0.12})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 加速エフェクト
    if (g.speedBoost > 0) {
      ctx.fillStyle = `rgba(255,170,0,${0.06 + Math.sin(time * 10) * 0.03})`;
      ctx.fillRect(0, 0, W, H);
    }
  },

  // ポストプロセス効果（スキャンライン + ビネット）
  drawPostProcess(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // スキャンライン（CRT風）
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }

    // ビネット効果
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  },

  drawCompass(ctx: CanvasRenderingContext2D, g: GameState, W: number, H: number) {
    if (g.keys < g.reqKeys) return;
    const exitAng = normAngle(
      Math.atan2(g.exit.y - g.player.y, g.exit.x - g.player.x) - g.player.angle
    );
    const exitDist = distance(g.player.x, g.player.y, g.exit.x, g.exit.y);
    if (exitDist <= 2) return;

    const arrowX = W / 2 + Math.sin(exitAng) * 70;
    ctx.fillStyle = 'rgba(68,255,136,0.75)';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚪', arrowX, H - 45);
    ctx.font = '11px sans-serif';
    ctx.fillText(`${Math.floor(exitDist)}m`, arrowX, H - 28);
  },

  render(ctx: CanvasRenderingContext2D, g: GameState, W: number, H: number, closestEnemy: number) {
    const time = g.gTime / 1000;
    const danger = clamp(1 - closestEnemy / 8, 0, 1);

    // トーチ照明の揺らぎ（複数周波数の合成）
    const torchFlicker =
      Math.sin(time * 3.7) * 0.3 +
      Math.sin(time * 7.1) * 0.15 +
      Math.sin(time * 11.3) * 0.05 +
      0.5;

    this.drawBackground(ctx, g, W, H, danger);
    const zBuf = this.drawWalls(ctx, g, W, H, torchFlicker);
    this.getSprites(g).forEach(s => this.drawSprite(ctx, g, s, W, H, zBuf, time));
    this.drawEffects(ctx, g, W, H, danger, time);
    this.drawPostProcess(ctx, W, H);
    this.drawCompass(ctx, g, W, H);
  },
};
