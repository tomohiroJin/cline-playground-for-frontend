/**
 * 原始進化録 - PRIMAL PATH - Canvas スプライト描画
 *
 * 純粋関数: canvas → void (no state deps)
 */
import { ENEMY_COLORS, ENEMY_DETAILS, ENEMY_SMALL_DETAILS, TC } from './constants';
import type { CivTypeExt, DmgPopup, AwokenRecord } from './types';

/** 覚醒ビジュアル: シンボル情報 */
export interface AwakeningSymbol {
  color: string;
  /** 覚醒IDからシンボル形状を推定 */
  shape: 'flame' | 'leaf' | 'skull' | 'star';
}

/** 覚醒ビジュアル情報 */
export interface AwakeningVisual {
  symbols: AwakeningSymbol[];
  hasAura: boolean;
  auraColor?: string;
}

/** 覚醒IDからシンボル形状を決定 */
function symbolShape(id: string): AwakeningSymbol['shape'] {
  if (id.includes('tech')) return 'flame';
  if (id.includes('life')) return 'leaf';
  if (id.includes('rit')) return 'skull';
  return 'star';
}

/** 覚醒段階に応じた視覚情報を返す */
export function getAwakeningVisual(fe: CivTypeExt | null, awoken: AwokenRecord[]): AwakeningVisual {
  if (awoken.length === 0) {
    return { symbols: [], hasAura: false };
  }

  const symbols: AwakeningSymbol[] = awoken.map(a => ({
    color: a.cl,
    shape: symbolShape(a.id),
  }));

  // 大覚醒（feが設定されている）の場合はオーラあり
  const hasAura = fe !== null;
  const auraColor = hasAura ? TC[fe] : undefined;

  return { symbols, hasAura, auraColor };
}

function pxRect(ctx: CanvasRenderingContext2D, s: number, x: number, y: number, w: number, h: number, cl: string) {
  ctx.fillStyle = cl;
  ctx.fillRect(x * s, y * s, w * s, h * s);
}

export function drawPlayer(c: HTMLCanvasElement, s = 2, fe?: CivTypeExt | null, awoken?: AwokenRecord[]): void {
  const x = c.getContext('2d')!;
  c.width = 16 * s;
  c.height = 22 * s;
  x.clearRect(0, 0, c.width, c.height);
  const d = (a: number, b: number, w: number, h: number, cl: string) => pxRect(x, s, a, b, w, h, cl);

  // 大覚醒時のオーラ（背景レイヤー）
  const visual = awoken ? getAwakeningVisual(fe ?? null, awoken) : undefined;
  if (visual?.hasAura && visual.auraColor) {
    x.globalAlpha = 0.15;
    x.fillStyle = visual.auraColor;
    x.fillRect(0, 0, c.width, c.height);
    // 外枠のグロー
    x.globalAlpha = 0.4;
    x.strokeStyle = visual.auraColor;
    x.lineWidth = 2;
    x.strokeRect(1, 1, c.width - 2, c.height - 2);
    x.globalAlpha = 1;
  }

  const skinMap: Record<string, string> = { rit: '#a06080', tech: '#d0a050', bal: '#c0a870' };
  const hairMap: Record<string, string> = { rit: '#601040', tech: '#c04020', bal: '#806020' };
  const skin = (fe && skinMap[fe]) || '#c09060';
  const hair = (fe && hairMap[fe]) || '#4a2818';

  d(5, 0, 6, 6, skin); d(5, 0, 6, 2, hair); d(4, 0, 2, 3, hair);
  d(6, 2, 2, 1, '#fff'); d(6, 2, 1, 1, fe === 'rit' ? '#e01040' : '#222');
  d(4, 6, 8, 8, skin); d(4, 11, 8, 3, fe === 'life' ? '#306030' : '#806030');
  d(2, 6, 3, 5, skin); d(11, 6, 3, 5, skin); d(4, 14, 3, 6, skin); d(9, 14, 3, 6, skin);
  d(13, 2, 2, 14, '#8a6a40'); d(12, 0, 4, 3, fe === 'tech' ? '#e04020' : '#b0b0b0');

  const accents: Record<string, [number, number, number, number, string][]> = {
    tech: [[0, 4, 3, 2, '#f06020'], [1, 3, 1, 1, '#f0a020']],
    life: [[3, 0, 1, 2, '#50ff90'], [12, 0, 1, 2, '#50ff90'], [4, 6, 8, 1, '#306030']],
    rit: [[4, 0, 8, 1, '#f040f0'], [3, 5, 10, 1, '#800080'], [14, 4, 2, 6, '#a020a0']],
    bal: [[0, 4, 3, 2, '#e0c060'], [13, 4, 3, 2, '#e0c060'], [5, 0, 6, 1, '#f0c040'], [4, 6, 8, 1, '#c0a040']],
  };
  (fe && accents[fe] || []).forEach(a => d(a[0], a[1], a[2], a[3], a[4]));

  // 小覚醒時のシンボル（頭上に描画）
  if (visual && visual.symbols.length > 0 && !visual.hasAura) {
    const symbolSize = 3;
    const startX = Math.floor((16 - visual.symbols.length * (symbolSize + 1)) / 2);
    visual.symbols.forEach((sym, i) => {
      const sx = startX + i * (symbolSize + 1);
      // ピクセルアート風の小さなシンボルを頭上に描画
      x.fillStyle = sym.color;
      x.globalAlpha = 0.8;
      if (sym.shape === 'flame') {
        // 炎: ▲ 形
        pxRect(x, s, sx + 1, 0, 1, 1, sym.color);
        pxRect(x, s, sx, 1, 3, 1, sym.color);
      } else if (sym.shape === 'leaf') {
        // 葉: ◆ 形
        pxRect(x, s, sx + 1, 0, 1, 1, sym.color);
        pxRect(x, s, sx, 1, 3, 1, sym.color);
        pxRect(x, s, sx + 1, 2, 1, 1, sym.color);
      } else if (sym.shape === 'skull') {
        // 骸骨: □ 形
        pxRect(x, s, sx, 0, 3, 2, sym.color);
      } else {
        // 星: + 形
        pxRect(x, s, sx + 1, 0, 1, 1, sym.color);
        pxRect(x, s, sx, 1, 3, 1, sym.color);
        pxRect(x, s, sx + 1, 2, 1, 1, sym.color);
      }
      x.globalAlpha = 1;
    });
  }
}

export function drawAlly(c: HTMLCanvasElement, t: string, s = 2): void {
  const x = c.getContext('2d')!;
  c.width = 12 * s;
  c.height = 16 * s;
  x.clearRect(0, 0, c.width, c.height);
  const d = (a: number, b: number, w: number, h: number, cl: string) => pxRect(x, s, a, b, w, h, cl);

  const clMap: Record<string, string> = { tech: '#d08050', life: '#50c080' };
  const cl = clMap[t] || '#b060d0';
  d(3, 0, 6, 5, cl); d(4, 1, 2, 1, '#fff'); d(4, 1, 1, 1, '#222');
  d(2, 5, 8, 6, cl); d(0, 5, 3, 4, cl); d(9, 5, 3, 4, cl); d(2, 11, 3, 4, cl); d(7, 11, 3, 4, cl);
}

export function drawEnemy(c: HTMLCanvasElement, nm: string, big: boolean, s = 2): void {
  const sz = big ? 24 : 16;
  c.width = sz * s;
  c.height = sz * s;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, c.width, c.height);
  const d = (a: number, b: number, w: number, h: number, cl: string) => pxRect(x, s, a, b, w, h, cl);

  const cl = ENEMY_COLORS[nm] || '#e04040';
  if (big) {
    d(4, 2, 16, 14, cl); d(6, 0, 12, 6, cl); d(8, 3, 3, 3, '#fff'); d(13, 3, 3, 3, '#fff');
    d(8, 3, 2, 2, '#e01020'); d(13, 3, 2, 2, '#e01020'); d(4, 16, 5, 7, cl); d(15, 16, 5, 7, cl);
    ENEMY_DETAILS.forEach(det => {
      if (nm.indexOf(det.match) >= 0) det.parts.forEach(p => d(p[0], p[1], p[2], p[3], p[4] || cl));
    });
  } else {
    d(4, 2, 8, 6, cl); d(5, 0, 6, 4, cl); d(6, 2, 2, 2, '#fff'); d(9, 2, 2, 2, '#fff');
    d(6, 2, 1, 1, '#e01020'); d(9, 2, 1, 1, '#e01020'); d(4, 8, 3, 5, cl); d(9, 8, 3, 5, cl);
    ENEMY_SMALL_DETAILS.forEach(det => {
      if (nm.indexOf(det.match) >= 0) det.parts.forEach(p => d(p[0], p[1], p[2], p[3], p[4] || cl));
    });
  }
}

export function drawTitle(c: HTMLCanvasElement): void {
  const x = c.getContext('2d')!;
  c.width = 240;
  c.height = 130;
  for (let i = 0; i < 130; i++) {
    x.fillStyle = `rgb(${10 + (i / 130 * 6) | 0},${8 + (i / 130 * 10) | 0},${18 + (i / 130 * 8) | 0})`;
    x.fillRect(0, i, 240, 1);
  }
  for (let i = 0; i < 40; i++) {
    x.fillStyle = `rgba(255,255,200,${(Math.random() * 0.35 + 0.1).toFixed(2)})`;
    x.fillRect(Math.random() * 240 | 0, Math.random() * 70 | 0, 1, 1);
  }
  function mt(cx: number, bs: number, w: number, h: number, cl: string) {
    x.fillStyle = cl;
    for (let j = 0; j < w; j++) {
      const t = Math.abs(j - w / 2) / (w / 2);
      x.fillRect(cx - w / 2 + j, bs - Math.floor(h * (1 - t * t)), 1, Math.floor(h * (1 - t * t)));
    }
  }
  mt(40, 112, 80, 50, '#162016'); mt(120, 112, 100, 65, '#1e2030'); mt(205, 112, 65, 45, '#2a1616');
  x.fillStyle = '#f04020'; x.fillRect(200, 65, 5, 3); x.fillRect(201, 63, 3, 2);
  x.fillStyle = '#16120a'; x.fillRect(0, 110, 240, 20);
  x.fillStyle = '#243018';
  for (let i = 0; i < 240; i += 4 + (Math.random() * 6 | 0)) x.fillRect(i, 107 + (Math.random() * 3 | 0), 2, 4);
  const d = (a: number, b: number, w: number, h: number, cl: string) => { x.fillStyle = cl; x.fillRect(a, b, w, h); };
  d(108, 88, 6, 6, '#c09060'); d(106, 94, 10, 10, '#c09060'); d(106, 100, 10, 4, '#806030');
  d(106, 104, 4, 6, '#c09060'); d(112, 104, 4, 6, '#c09060'); d(118, 86, 2, 18, '#8a6a40');
  d(117, 82, 4, 5, '#b0b0b0'); d(126, 102, 4, 4, '#f08020'); d(127, 100, 2, 3, '#f0c040');
  x.fillStyle = '#e0d8c0'; x.beginPath(); x.arc(200, 22, 8, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgb(10,8,18)'; x.beginPath(); x.arc(203, 20, 7, 0, Math.PI * 2); x.fill();
}

/** 敵スプライト下部にHPバーを描画 */
export function drawEnemyHpBar(ctx: CanvasRenderingContext2D, hp: number, mhp: number, x: number, y: number, w: number): void {
  const barH = 3;
  const ratio = Math.max(0, Math.min(1, hp / mhp));
  // 背景
  ctx.fillStyle = '#1a1a22';
  ctx.fillRect(x, y, w, barH);
  // HPバー
  const cl = ratio > 0.5 ? '#50e090' : ratio > 0.2 ? '#f0c040' : '#f05050';
  ctx.fillStyle = cl;
  ctx.fillRect(x, y, Math.floor(w * ratio), barH);
  // 枠
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, barH);
}

/** 状態アイコン（火傷）を描画 */
export function drawStatusIcons(ctx: CanvasRenderingContext2D, x: number, y: number, burn: boolean): void {
  if (burn) {
    ctx.font = '10px serif';
    ctx.fillText('🔥', x, y);
  }
}

/** 火傷パーティクルを敵スプライト周囲に描画 */
export function drawBurnFx(ctx: CanvasRenderingContext2D, w: number, h: number, frame: number): void {
  const count = 12;
  const colors = ['#ff2000', '#ff5500', '#ff9900', '#ffcc00'];
  for (let i = 0; i < count; i++) {
    const angle = (frame * 0.1 + i * (Math.PI * 2 / count));
    const radius = w * 0.32 + Math.sin(frame * 0.2 + i * 0.7) * 6;
    const px = w / 2 + Math.cos(angle) * radius;
    const py = h / 2 + Math.sin(angle) * radius * 0.5 - (frame * 0.6) % 10;
    const size = 3 + Math.sin(frame * 0.35 + i * 1.3) * 2;
    ctx.globalAlpha = 0.7 + Math.sin(frame * 0.25 + i) * 0.3;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
    // 白い芯で発光感
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** ダメージポップアップをCanvas上に描画 */
export function drawDmgPopup(ctx: CanvasRenderingContext2D, popup: DmgPopup, w: number, h: number): void {
  const px = popup.x * w;
  const py = popup.y + h * 0.5;
  ctx.globalAlpha = popup.a;
  ctx.font = `bold ${popup.fs}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText(String(popup.v), px, py);
  ctx.fillStyle = popup.cl;
  ctx.fillText(String(popup.v), px, py);
  ctx.globalAlpha = 1;
}
