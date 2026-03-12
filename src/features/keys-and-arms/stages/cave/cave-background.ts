/**
 * KEYS & ARMS — 洞窟ステージ背景描画モジュール
 * 洞窟の静的/準静的な背景要素（レイアウト、鍾乳石、松明、水滴、装飾等）を描画する。
 */

import {
  L1T, L1B, L2T, L2B, L3T, L3B, SHL, SHR,
  KY1, POS,
  W, H, BG, ON, RK,
  RAT
} from '../../constants';

import { rng, rngSpread, TAU } from '../../core/math';

import type { EngineContext } from '../../types';

/**
 * 洞窟背景描画ファクトリ
 * @param ctx ゲームコンテキスト
 * @returns drawCaveBG 関数
 */
export function createCaveBackground(ctx: EngineContext) {
  const { G, draw, audio } = ctx;
  const { $, circle, circleS, onFill, onStroke, px } = draw;
  const { S } = audio;

  /** 洞窟背景描画 */
  function drawCaveBG() {
    $.fillStyle = RK; $.fillRect(0, 26, W, H - 36);
    $.fillStyle = BG;
    const mkP = (pts: number[][]) => { $.beginPath(); $.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) $.lineTo(pts[i][0], pts[i][1]); $.closePath(); $.fill(); };
    mkP([[0, L1T - 8], [16, L1T], [80, L1T + 2], [160, L1T - 2], [SHL, L1T], [SHR, L1T], [340, L1T - 3], [400, L1T + 1], [W, L1T],
      [W, L1B], [400, L1B + 2], [340, L1B], [SHR, L1B], [SHL, L1B], [160, L1B + 3], [80, L1B - 1], [16, L1B + 2], [0, L1B + 8]]);
    mkP([[0, L2T - 2], [60, L2T + 1], [70, L2T - 4], [SHL, L2T], [SHR, L2T], [300, L2T - 2], [380, L2T + 1], [W, L2T - 2],
      [W, L2B + 2], [380, L2B], [300, L2B + 3], [SHR, L2B], [SHL, L2B], [70, L2B + 4], [60, L2B - 1], [0, L2B + 2]]);
    mkP([[130, L3T], [340, L3T - 2], [340, L3B + 2], [130, L3B + 2]]);
    $.fillRect(SHL, L1B - 2, SHR - SHL, L2T - L1B + 4); $.fillRect(SHL, L2B - 2, SHR - SHL, L3T - L2B + 4);
    $.beginPath(); $.moveTo(0, L1T - 16); $.quadraticCurveTo(28, L1T - 10, 16, L1T); $.lineTo(0, L1T); $.closePath(); $.fill();
    $.beginPath(); $.moveTo(0, L1B + 16); $.quadraticCurveTo(28, L1B + 10, 16, L1B + 2); $.lineTo(0, L1B); $.closePath(); $.fill();
    $.fillRect(370, L1T - 6, W - 370, 6); $.fillRect(370, L1B, W - 370, 6);
    $.fillRect(0, L2T - 4, 70, 4); $.fillRect(0, L2B, 70, 6);
    $.fillRect(370, L2T - 5, W - 370, 5); $.fillRect(370, L2B, W - 370, 6);
    $.fillRect(170, L3T - 4, 100, 4); $.fillRect(170, L3B, 100, 6);

    // レンガテクスチャ（薄い、各部屋エリア）
    onFill(.04);
    for (let y = L1T + 2; y < L1B; y += 8) for (let x = 370; x < W; x += 14) $.fillRect(x + (y % 16 ? 0 : 7), y, 12, 1);
    for (let y = L2T + 2; y < L2B; y += 8) for (let x = 0; x < 70; x += 14) $.fillRect(x + (y % 16 ? 0 : 7), y, 12, 1);
    for (let y = L2T + 2; y < L2B; y += 8) for (let x = 370; x < W; x += 14) $.fillRect(x + (y % 16 ? 0 : 7), y, 12, 1);
    for (let y = L3T + 2; y < L3B; y += 8) for (let x = 170; x < 270; x += 14) $.fillRect(x + (y % 16 ? 0 : 7), y, 12, 1);
    $.globalAlpha = 1;

    // 境界線
    $.strokeStyle = ON; $.lineWidth = 2;
    $.beginPath(); $.moveTo(0, L1T - 8); $.lineTo(16, L1T); $.lineTo(80, L1T + 2); $.lineTo(160, L1T - 2); $.lineTo(SHL, L1T); $.lineTo(SHR, L1T); $.lineTo(340, L1T - 3); $.lineTo(370, L1T - 6); $.lineTo(W, L1T - 6); $.stroke();
    $.beginPath(); $.moveTo(0, L1B + 8); $.lineTo(16, L1B + 2); $.lineTo(80, L1B - 1); $.lineTo(160, L1B + 3); $.lineTo(SHL, L1B); $.moveTo(SHR, L1B); $.lineTo(340, L1B); $.lineTo(370, L1B + 6); $.lineTo(W, L1B + 6); $.stroke();
    $.beginPath(); $.moveTo(0, L2T - 4); $.lineTo(70, L2T - 4); $.moveTo(SHR, L2T); $.lineTo(370, L2T - 5); $.lineTo(W, L2T - 5); $.stroke();
    $.beginPath(); $.moveTo(0, L2B + 2); $.lineTo(70, L2B + 4); $.moveTo(SHR, L2B); $.lineTo(370, L2B + 4); $.lineTo(W, L2B + 4); $.stroke();
    $.beginPath(); $.moveTo(130, L3T); $.lineTo(170, L3T - 4); $.lineTo(270, L3T - 4); $.lineTo(340, L3T - 2); $.stroke();
    $.beginPath(); $.moveTo(130, L3B + 2); $.lineTo(170, L3B + 6); $.lineTo(270, L3B + 6); $.lineTo(340, L3B + 2); $.stroke();
    $.lineWidth = 1; $.fillStyle = ON;
    $.fillRect(SHL, L1B, 2, L2T - L1B); $.fillRect(SHR - 2, L1T, 2, L1B - L1T);
    $.fillRect(SHL, L2B, 2, L3T - L2B); $.fillRect(SHR - 2, L2T, 2, L2B - L2T); $.fillRect(SHR - 2, L3T, 2, L3B - L3T);
    // ハシゴ
    const dL = (x: number, y1: number, y2: number) => { $.fillStyle = ON; $.fillRect(x, y1, 2, y2 - y1); $.fillRect(x + 18, y1, 2, y2 - y1); for (let y = y1 + 6; y < y2; y += 9) $.fillRect(x, y, 20, 2); };
    dL(SHL + 2, L1B + 2, L2T - 2); dL(SHL + 2, L2B + 2, L3T - 2);

    // === 障害物 ===
    // 岩 pos 1
    { const rx = POS[1].x + 2, ry = L1B - 2; $.fillStyle = ON; $.beginPath(); $.moveTo(rx - 8, ry); $.lineTo(rx - 4, ry - 10); $.lineTo(rx + 2, ry - 14); $.lineTo(rx + 8, ry - 10); $.lineTo(rx + 12, ry); $.closePath(); $.fill(); $.fillStyle = BG; $.fillRect(rx - 2, ry - 10, 4, 2); }
    // 穴 pos 3
    { const p3 = POS[3].x, py = L1B - 2; $.fillStyle = RK; $.fillRect(p3 - 8, py - 1, 18, 4); $.fillStyle = ON; $.fillRect(p3 - 9, py - 2, 2, 4); $.fillRect(p3 + 10, py - 2, 2, 4); onFill(.15); $.fillRect(p3 - 7, py, 14, 2); $.globalAlpha = 1; }
    // 低い天井 pos 6
    { const lx = POS[6].x; $.fillStyle = ON; $.beginPath(); $.moveTo(lx - 12, L2T); $.lineTo(lx - 6, L2T + 16); $.lineTo(lx + 2, L2T + 20); $.lineTo(lx + 10, L2T + 16); $.lineTo(lx + 16, L2T); $.closePath(); $.fill(); $.fillStyle = BG; $.fillRect(lx - 4, L2T + 8, 4, 2); $.fillRect(lx + 4, L2T + 12, 3, 2);
      // スライムの滴り
      const sd = (G.tick * 2) % 80; if (sd < 40) { onFill(.35);
        circle(lx + 2, L2T + 20 + sd * .6, 1.5); $.globalAlpha = 1; } }
    // 岩 pos 8
    { const rx = POS[8].x - 2, ry = L2B - 2; $.fillStyle = ON; $.beginPath(); $.moveTo(rx - 6, ry); $.lineTo(rx - 2, ry - 8); $.lineTo(rx + 4, ry - 12); $.lineTo(rx + 10, ry - 8); $.lineTo(rx + 14, ry); $.closePath(); $.fill(); $.fillStyle = BG; $.fillRect(rx + 1, ry - 8, 3, 2); }

    // 鍾乳石・石筍
    const sc = (x: number, y: number, w: number, h: number) => { $.fillStyle = ON; $.beginPath(); $.moveTo(x, y); $.lineTo(x + w, y); $.lineTo(x + w / 2, y + h); $.closePath(); $.fill(); };
    const sg = (x: number, y: number, w: number, h: number) => { $.fillStyle = ON; $.beginPath(); $.moveTo(x + w / 2, y); $.lineTo(x, y + h); $.lineTo(x + w, y + h); $.closePath(); $.fill(); };
    sc(65, L1T, 8, 12); sc(270, L1T, 10, 14); sc(350, L1T - 2, 8, 10);
    sg(70, L1B - 10, 6, 10); sg(280, L1B - 10, 10, 10);
    sc(50, L2T, 10, 12); sc(280, L2T - 1, 8, 12); sc(360, L2T - 3, 10, 14);
    sg(55, L2B - 8, 8, 8); sg(290, L2B - 8, 6, 8); sg(370, L2B - 10, 8, 10);
    sc(180, L3T - 2, 8, 10); sc(260, L3T, 6, 8); sg(195, L3B - 8, 6, 8); sg(270, L3B - 8, 8, 8);

    // === 部屋の装飾 ===
    // BAT部屋（右L1）：糞汚れ、天井の爪痕
    onFill(.35);
    $.fillRect(390, L1B - 3, 8, 3); $.fillRect(408, L1B - 2, 6, 2); $.fillRect(420, L1B - 4, 10, 4);
    $.strokeStyle = ON; $.lineWidth = 1;
    $.beginPath(); $.moveTo(396, L1T); $.lineTo(394, L1T + 6); $.stroke(); $.beginPath(); $.moveTo(400, L1T); $.lineTo(399, L1T + 5); $.stroke();
    $.beginPath(); $.moveTo(418, L1T); $.lineTo(416, L1T + 7); $.stroke(); $.globalAlpha = 1;

    // TRAP部屋（右L2）：天井から鎖
    { const tx = POS[9].x;
      $.fillStyle = ON;
      const chain = (x: number, y1: number, y2: number) => { for (let y = y1; y < y2; y += 5) { $.fillRect(x, y, 3, 3); $.fillRect(x + 1, y + 3, 1, 2); } };
      chain(tx - 30, L2T + 2, L2T + 24); chain(tx + 28, L2T + 2, L2T + 20); }

    // MIMIC部屋（左L2）：散乱コイン
    $.fillStyle = ON;
    circle(20, L2B - 4, 2); circle(32, L2B - 3, 2.5);
    circle(48, L2B - 5, 2); circle(12, L2B - 6, 1.5);
    circle(55, L2B - 3, 2);

    // DOOR部屋（中央L3）：アーチ装飾
    { const dx = POS[10].x; $.fillStyle = ON;
      $.beginPath(); $.arc(dx, L3T - 2, 30, Math.PI, 0); $.lineWidth = 3; $.strokeStyle = ON; $.stroke();
      for (let i = 0; i < 5; i++) { const a = Math.PI + i * (Math.PI / 4); circle(dx + Math.cos(a) * 28, L3T - 2 + Math.sin(a) * 28, 1.5); }
      $.lineWidth = 1; }

    // キノコ（固体装飾）
    $.fillStyle = ON;
    const mush = (x: number, y: number) => { $.beginPath(); $.arc(x, y - 2, 3, Math.PI, 0); $.fill(); $.fillRect(x - 1, y - 1, 2, 4); };
    mush(85, L1B); mush(175, L2B); mush(340, L1B); mush(310, L3B);

    // 松明（光源付き）
    const torch = (x: number, y: number) => {
      // 光の輪
      const gl = .04 + Math.sin(G.tick * .08 + x) * .015; onFill(gl);
      circle(x + 2, y + 4, 18); $.globalAlpha = 1;
      // 松明本体
      $.fillStyle = ON; $.fillRect(x, y + 6, 4, 10);
      const fl = G.tick % 18 < 6 ? 0 : G.tick % 18 < 12 ? 1 : 2; $.fillRect(x - 1 + fl, y + 1, 5, 5); $.fillRect(x, y - 1 + (fl === 1 ? 1 : 0), 3, 3);
      $.fillRect(x + fl, y - 2, 2, 2); // 炎先端
      if (G.tick % 9 === 0) G.sparks.push({ x: x + 1, y: y - 2, vx: rngSpread(.75), vy: -rng(0, 1.5), life: 14 });
      if (G.tick % 14 === 0) G.sparks.push({ x: x + 2, y: y, vx: rngSpread(.5), vy: -rng(0, 2), life: 10 });
      if (G.tick % 11 === 0) G.smoke.push({ x: x + 1, y: y - 3, vx: rngSpread(.2), vy: -.3 - rng(0, .3), life: 28, s: rng(2, 4) });
    };
    torch(100, L1T + 3); torch(355, L1T + 3); torch(100, L2T + 3); torch(355, L2T + 3);
    $.fillStyle = ON; G.sparks = G.sparks.filter(s => { s.x += s.vx; s.y += s.vy; s.life--; if (s.life > 0) { $.globalAlpha = s.life / 14; $.fillRect(s.x, s.y, 2, 2); $.globalAlpha = 1; return true; } return false; });
    // 松明の煙
    G.smoke = G.smoke.filter(sm => { sm.x += sm.vx; sm.y += sm.vy; sm.s += .03; sm.life--; if (sm.life > 0) { onFill(sm.life / 28 * .08); circle(sm.x, sm.y, sm.s); $.globalAlpha = 1; return true; } return false; });

    // 入口看板
    { const sx = 14, sy = L1T - 22; $.fillStyle = ON; $.fillRect(sx, sy, 36, 14); $.fillStyle = BG; $.fillRect(sx + 1, sy + 1, 34, 12);
      $.fillStyle = ON; $.fillRect(sx + 16, sy + 14, 3, 10);
      $.font = '6px "Press Start 2P"'; $.textAlign = 'center'; $.textBaseline = 'top'; $.fillText('CAVE', sx + 18, sy + 3); }

    // 水滴（サウンドトリガー付き）
    const drip = (x: number, y0: number, per: number, off: number) => { const t = (G.tick + off) % per;
      if (t < 15) { onFill(.5); $.fillRect(x, y0 + t * 2, 2, 3); $.globalAlpha = 1; }
      if (t === 15 && off === 0) S.drip();
      if (t >= 15 && t < 28) { const r = (t - 15) * .7; onStroke(.25); $.lineWidth = 1; circleS(x + 1, y0 + 32, r); $.globalAlpha = 1; } };
    drip(152, L1T + 12, 55, 0); drip(290, L2T + 10, 65, 20); drip(240, L3T + 4, 48, 35);

    // クリスタル（光源）
    const cry = (x: number, y: number, h: number) => { const gl = .18 + Math.sin(G.tick * .05 + x) * .1; onFill(gl); $.beginPath(); $.moveTo(x, y + h); $.lineTo(x + 3, y); $.lineTo(x + 6, y + h); $.closePath(); $.fill();
      $.globalAlpha = gl * .3; circle(x + 3, y + h / 2, h * .6); $.globalAlpha = 1; };
    cry(60, L1B - 16, 10); cry(340, L1B - 12, 8); cry(60, L2B - 14, 10); cry(310, L2B - 12, 8); cry(200, L3B - 10, 8); cry(300, L3B - 12, 10);

    // 蜘蛛の巣
    onStroke(.25); $.lineWidth = 1;
    const web = (x: number, y: number, sx2: number, sy2: number) => { $.beginPath(); $.moveTo(x, y); $.quadraticCurveTo(x + sx2 * .5, y + sy2 * .3, x + sx2, y); $.stroke(); $.beginPath(); $.moveTo(x, y); $.quadraticCurveTo(x + sx2 * .3, y + sy2 * .5, x, y + sy2); $.stroke(); $.beginPath(); $.moveTo(x, y); $.quadraticCurveTo(x + sx2 * .4, y + sy2 * .4, x + sx2 * .7, y + sy2 * .7); $.stroke(); };
    web(0, L1T - 6, 30, 20); web(W - 2, L2T - 4, -30, 20); web(130, L3T - 2, 20, 16); web(W - 2, L1T - 6, -25, 18); $.globalAlpha = 1;

    // 骨
    $.fillStyle = ON; $.fillRect(170, L1B - 4, 8, 2); $.fillRect(172, L1B - 6, 2, 6); $.fillRect(176, L1B - 6, 2, 6);
    // ミミック部屋のドクロ
    $.fillStyle = ON; $.fillRect(14, L2B - 8, 8, 6); $.fillRect(16, L2B - 10, 4, 3); $.fillStyle = BG; $.fillRect(16, L2B - 7, 2, 2); $.fillRect(20, L2B - 7, 2, 2);
    // トラップ部屋の骨
    $.fillStyle = ON; $.fillRect(380, L2B - 6, 10, 2); $.fillRect(384, L2B - 8, 2, 6);

    // 苔
    $.fillStyle = 'rgba(70,100,60,0.35)'; $.fillRect(80, L1B - 3, 14, 3); $.fillRect(320, L2B - 2, 20, 2); $.fillRect(160, L3B - 2, 16, 2); $.fillRect(410, L1B - 2, 20, 2); $.fillRect(10, L2B - 2, 30, 2);

    // ひび
    onStroke(.4); $.beginPath(); $.moveTo(90, L1T + 18); $.lineTo(96, L1T + 24); $.lineTo(94, L1T + 30); $.stroke();
    $.beginPath(); $.moveTo(320, L2T + 12); $.lineTo(326, L2T + 20); $.stroke();
    $.beginPath(); $.moveTo(200, L3T + 6); $.lineTo(204, L3T + 12); $.lineTo(202, L3T + 18); $.stroke(); $.globalAlpha = 1;

    // 洞窟入口の光
    $.fillStyle = 'rgba(176,188,152,0.08)'; $.beginPath(); $.moveTo(0, L1T - 16); $.lineTo(50, KY1 - 4); $.lineTo(50, KY1 + 28); $.lineTo(0, L1B + 16); $.closePath(); $.fill();
    // 漏れ光
    onStroke(.08); $.lineWidth = 2;
    $.beginPath(); $.moveTo(0, L1T); $.lineTo(40, KY1 + 4); $.stroke();
    $.beginPath(); $.moveTo(0, L1T + 10); $.lineTo(35, KY1 + 12); $.stroke(); $.globalAlpha = 1; $.lineWidth = 1;

    // ネズミ（固体、環境クリーチャー）
    const ratX = (G.tick * 1.2) % 180;
    px(RAT, ratX + 160, L1B - 12, 2, true);
    px(RAT, (180 - ratX % 180) + 140, L2B - 12, 2, true, true);

    // ほこり（BG描画。移動は cavDraw で処理）
    $.fillStyle = ON; G.dust.forEach(d => {
      $.globalAlpha = d.a + Math.sin(G.tick * .03 + d.x) * .04; $.fillRect(d.x, d.y, d.s, d.s); }); $.globalAlpha = 1;
    // 水たまり（光沢付き）
    onFill(.18); $.beginPath(); $.ellipse(156, L1B - 1, 8, 2, 0, 0, TAU); $.fill();
    $.beginPath(); $.ellipse(294, L2B - 1, 10, 2, 0, 0, TAU); $.fill(); $.beginPath(); $.ellipse(244, L3B - 1, 8, 2, 0, 0, TAU); $.fill();
    // 水たまりの光沢線
    $.globalAlpha = .06 + Math.sin(G.tick * .08) * .03; $.fillRect(150, L1B - 2, 4, 1); $.fillRect(158, L1B - 2, 3, 1);
    $.fillRect(288, L2B - 2, 5, 1); $.fillRect(296, L2B - 2, 4, 1); $.globalAlpha = 1;

    // 足跡パーティクル
    $.fillStyle = ON; G.stepDust = G.stepDust.filter(d => { d.x += d.vx; d.y += d.vy; d.vy -= .02; d.life--;
      if (d.life > 0) { $.globalAlpha = d.life / 12 * .4; circle(d.x, d.y, d.s); $.globalAlpha = 1; return true; } return false; });

    // 鍵のきらめき
    $.fillStyle = ON; G.keySpk = G.keySpk.filter(k => { k.life--; if (k.life > 0) { $.globalAlpha = k.life / 10; $.fillRect(k.x, k.y, 1, 1); $.fillRect(k.x - 1, k.y, 3, 1); $.fillRect(k.x, k.y - 1, 1, 3); $.globalAlpha = 1; return true; } return false; });

    // コウモリヒット時の羽
    $.fillStyle = ON; G.feathers = G.feathers.filter(f => { f.x += f.vx; f.y += f.vy; f.vy += .05; f.life--;
      if (f.life > 0) { $.globalAlpha = f.life / 20; $.save(); $.translate(f.x, f.y); $.rotate(f.life * .2); $.fillRect(-2, -1, 4, 2); $.fillRect(-1, -2, 2, 4); $.restore(); $.globalAlpha = 1; return true; } return false; });

    // スコアポップアップ
    ctx.particles.Popups.updateAndDraw();
  }

  return drawCaveBG;
}
