/**
 * 原始進化録 - PRIMAL PATH - Canvas スプライト描画
 *
 * 純粋関数: canvas → void (no state deps)
 * 拡大版: ベースグリッド 24px、スケール係数 3
 */
import { ENEMY_COLORS, ENEMY_DETAILS, ENEMY_SMALL_DETAILS, TC } from './constants';
import {
  SPRITE_SCALE, PLAYER_BASE, ALLY_BASE, ENEMY_BASE, BOSS_BASE,
  TITLE_SIZE, HP_BAR_HEIGHT,
} from './constants/ui';
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

type DrawFn = (a: number, b: number, w: number, h: number, cl: string) => void;

/** 大覚醒オーラを背景レイヤーとして描画 */
function drawPlayerAura(ctx: CanvasRenderingContext2D, cw: number, ch: number, auraColor: string): void {
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = auraColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = auraColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, cw - 2, ch - 2);
  ctx.globalAlpha = 1;
}

/** 文明ごとの装飾アクセントを描画 */
function drawPlayerAccents(fe: CivTypeExt, d: DrawFn): void {
  const accents: Record<string, [number, number, number, number, string][]> = {
    tech: [[0, 6, 4, 3, '#f06020'], [1, 5, 2, 1, '#f0a020'], [20, 0, 1, 4, '#ff4020']],
    life: [[4, 0, 2, 3, '#50ff90'], [18, 0, 2, 3, '#50ff90'], [5, 9, 14, 1, '#306030']],
    rit: [[5, 0, 14, 1, '#f040f0'], [4, 8, 16, 1, '#800080'], [22, 6, 2, 8, '#a020a0']],
    bal: [[0, 6, 4, 3, '#e0c060'], [20, 6, 4, 3, '#e0c060'], [7, 0, 10, 1, '#f0c040'], [5, 9, 14, 1, '#c0a040']],
  };
  (accents[fe] || []).forEach(a => d(a[0], a[1], a[2], a[3], a[4]));
}

/** 小覚醒シンボルを頭上に描画 */
function drawPlayerSymbols(ctx: CanvasRenderingContext2D, symbols: AwakeningSymbol[], bw: number, s: number): void {
  const symbolSize = 4;
  const startX = Math.floor((bw - symbols.length * (symbolSize + 1)) / 2);
  symbols.forEach((sym, i) => {
    const sx = startX + i * (symbolSize + 1);
    ctx.globalAlpha = 0.8;
    if (sym.shape === 'skull') {
      pxRect(ctx, s, sx, 0, 4, 3, sym.color);
    } else {
      pxRect(ctx, s, sx + 1, 0, 2, 1, sym.color);
      pxRect(ctx, s, sx, 1, 4, 1, sym.color);
      if (sym.shape !== 'flame') {
        pxRect(ctx, s, sx + 1, 2, 2, 1, sym.color);
      }
    }
    ctx.globalAlpha = 1;
  });
}

/** プレイヤーキャラクターをピクセルアートで描画する（覚醒オーラ・シンボル対応）
 * 24×32 グリッド、デフォルトスケール 3 */
export function drawPlayer(c: HTMLCanvasElement, s = SPRITE_SCALE, fe?: CivTypeExt | null, awoken?: AwokenRecord[]): void {
  const bw = PLAYER_BASE.w;
  const bh = PLAYER_BASE.h;
  const ctx = c.getContext('2d')!;
  c.width = bw * s;
  c.height = bh * s;
  ctx.clearRect(0, 0, c.width, c.height);
  const d: DrawFn = (a, b, w, h, cl) => pxRect(ctx, s, a, b, w, h, cl);

  // 覚醒ビジュアル
  const visual = awoken ? getAwakeningVisual(fe ?? null, awoken) : undefined;
  if (visual?.hasAura && visual.auraColor) drawPlayerAura(ctx, c.width, c.height, visual.auraColor);

  const skinMap: Record<string, string> = { rit: '#a06080', tech: '#d0a050', bal: '#c0a870' };
  const hairMap: Record<string, string> = { rit: '#601040', tech: '#c04020', bal: '#806020' };
  const skin = (fe && skinMap[fe]) || '#c09060';
  const hair = (fe && hairMap[fe]) || '#4a2818';

  // 頭部・目
  d(7, 0, 10, 9, skin); d(7, 0, 10, 3, hair); d(5, 0, 3, 5, hair);
  d(9, 3, 3, 2, '#fff'); d(9, 3, 2, 1, fe === 'rit' ? '#e01040' : '#222');
  // 胴体・腕・足
  d(5, 9, 14, 11, skin); d(5, 16, 14, 4, fe === 'life' ? '#306030' : '#806030');
  d(2, 9, 4, 8, skin); d(18, 9, 4, 8, skin);
  d(6, 20, 4, 10, skin); d(14, 20, 4, 10, skin);
  // 武器
  d(20, 3, 3, 20, '#8a6a40'); d(19, 0, 5, 4, fe === 'tech' ? '#e04020' : '#b0b0b0');
  d(19, 4, 1, 2, '#666');

  if (fe) drawPlayerAccents(fe, d);
  if (visual && visual.symbols.length > 0 && !visual.hasAura) drawPlayerSymbols(ctx, visual.symbols, bw, s);
}

/** 味方キャラクターをピクセルアートで描画する（18×24 グリッド） */
export function drawAlly(c: HTMLCanvasElement, t: string, s = SPRITE_SCALE): void {
  const bw = ALLY_BASE.w;
  const bh = ALLY_BASE.h;
  const x = c.getContext('2d')!;
  c.width = bw * s;
  c.height = bh * s;
  x.clearRect(0, 0, c.width, c.height);
  const d = (a: number, b: number, w: number, h: number, cl: string) => pxRect(x, s, a, b, w, h, cl);

  const clMap: Record<string, string> = { tech: '#d08050', life: '#50c080' };
  const cl = clMap[t] || '#b060d0';
  // 頭部（種族ごとのシルエット差を強調）
  d(4, 0, 10, 8, cl);
  // 目（2px 表現）
  d(6, 2, 3, 2, '#fff'); d(6, 2, 2, 1, '#222');
  // 胴体
  d(3, 8, 12, 8, cl);
  // 腕
  d(0, 8, 4, 6, cl); d(14, 8, 4, 6, cl);
  // 足
  d(3, 16, 5, 7, cl); d(10, 16, 5, 7, cl);
  // ボディパターン（種族識別）
  if (t === 'tech') {
    d(5, 9, 2, 1, '#ff8040'); d(11, 9, 2, 1, '#ff8040');
  } else if (t === 'life') {
    d(6, 10, 6, 1, '#80ff80');
  } else {
    d(7, 9, 4, 2, '#c080ff');
  }
}

/** 敵キャラクターをピクセルアートで描画する（通常 24×24 / ボス 32×32） */
export function drawEnemy(c: HTMLCanvasElement, nm: string, big: boolean, s = SPRITE_SCALE): void {
  const sz = big ? BOSS_BASE.w : ENEMY_BASE.w;
  c.width = sz * s;
  c.height = sz * s;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, c.width, c.height);
  const d = (a: number, b: number, w: number, h: number, cl: string) => pxRect(x, s, a, b, w, h, cl);

  const cl = ENEMY_COLORS[nm] || '#e04040';
  if (big) {
    // ボス: 32×32 グリッド
    d(5, 3, 22, 18, cl); d(8, 0, 16, 8, cl);
    // 目（大きく精緻に）
    d(10, 4, 4, 4, '#fff'); d(18, 4, 4, 4, '#fff');
    d(10, 4, 3, 3, '#e01020'); d(18, 4, 3, 3, '#e01020');
    // 足
    d(5, 21, 7, 10, cl); d(20, 21, 7, 10, cl);
    // ディテールパーツ
    ENEMY_DETAILS.forEach(det => {
      if (nm.indexOf(det.match) >= 0) det.parts.forEach(p => d(p[0], p[1], p[2], p[3], p[4] || cl));
    });
  } else {
    // 通常敵: 24×24 グリッド
    d(5, 3, 14, 10, cl); d(7, 0, 10, 6, cl);
    // 目（ディテール改善）
    d(8, 3, 3, 3, '#fff'); d(13, 3, 3, 3, '#fff');
    d(8, 3, 2, 2, '#e01020'); d(13, 3, 2, 2, '#e01020');
    // 足
    d(5, 13, 5, 8, cl); d(14, 13, 5, 8, cl);
    // ディテールパーツ
    ENEMY_SMALL_DETAILS.forEach(det => {
      if (nm.indexOf(det.match) >= 0) det.parts.forEach(p => d(p[0], p[1], p[2], p[3], p[4] || cl));
    });
  }
}

/** タイトル画面のロゴをグラデーション背景付きで描画する（400×200） */
export function drawTitle(c: HTMLCanvasElement): void {
  const tw = TITLE_SIZE.w;
  const th = TITLE_SIZE.h;
  const x = c.getContext('2d')!;
  c.width = tw;
  c.height = th;
  // グラデーション背景
  for (let i = 0; i < th; i++) {
    x.fillStyle = `rgb(${10 + (i / th * 6) | 0},${8 + (i / th * 10) | 0},${18 + (i / th * 8) | 0})`;
    x.fillRect(0, i, tw, 1);
  }
  // 星
  for (let i = 0; i < 60; i++) {
    x.fillStyle = `rgba(255,255,200,${(Math.random() * 0.35 + 0.1).toFixed(2)})`;
    x.fillRect(Math.random() * tw | 0, Math.random() * 100 | 0, 1, 1);
  }
  // 山
  function mt(cx: number, bs: number, w: number, h: number, cl: string) {
    x.fillStyle = cl;
    for (let j = 0; j < w; j++) {
      const t = Math.abs(j - w / 2) / (w / 2);
      x.fillRect(cx - w / 2 + j, bs - Math.floor(h * (1 - t * t)), 1, Math.floor(h * (1 - t * t)));
    }
  }
  mt(66, 172, 130, 77, '#162016'); mt(200, 172, 166, 100, '#1e2030'); mt(340, 172, 108, 69, '#2a1616');
  // 火山口
  x.fillStyle = '#f04020'; x.fillRect(333, 100, 8, 5); x.fillRect(334, 97, 5, 3);
  // 地面
  x.fillStyle = '#16120a'; x.fillRect(0, 170, tw, 30);
  x.fillStyle = '#243018';
  for (let i = 0; i < tw; i += 4 + (Math.random() * 6 | 0)) x.fillRect(i, 165 + (Math.random() * 4 | 0), 3, 6);
  // キャラクター
  const d = (a: number, b: number, w: number, h: number, cl: string) => { x.fillStyle = cl; x.fillRect(a, b, w, h); };
  d(180, 135, 10, 10, '#c09060'); d(177, 145, 16, 16, '#c09060'); d(177, 155, 16, 6, '#806030');
  d(177, 161, 6, 10, '#c09060'); d(187, 161, 6, 10, '#c09060'); d(197, 133, 3, 28, '#8a6a40');
  d(196, 127, 6, 8, '#b0b0b0'); d(210, 158, 6, 6, '#f08020'); d(211, 155, 4, 4, '#f0c040');
  // 月
  x.fillStyle = '#e0d8c0'; x.beginPath(); x.arc(333, 34, 13, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgb(10,8,18)'; x.beginPath(); x.arc(338, 31, 11, 0, Math.PI * 2); x.fill();
}

/** 敵スプライト下部にHPバーを描画 */
export function drawEnemyHpBar(ctx: CanvasRenderingContext2D, hp: number, mhp: number, x: number, y: number, w: number): void {
  const barH = HP_BAR_HEIGHT;
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
    const radius = w * 0.32 + Math.sin(frame * 0.2 + i * 0.7) * 8;
    const px = w / 2 + Math.cos(angle) * radius;
    const py = h / 2 + Math.sin(angle) * radius * 0.5 - (frame * 0.6) % 12;
    const size = 5 + Math.sin(frame * 0.35 + i * 1.3) * 3;
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
