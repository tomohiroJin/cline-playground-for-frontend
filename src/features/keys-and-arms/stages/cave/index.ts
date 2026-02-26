/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — 洞窟ステージモジュール
 * engine.ts から抽出した STAGE 1: CAVE のロジック。
 * 3階層の探索・パズル・鍵収集ステージ。
 */

import {
  SC, L1T, L1B, L2T, L2B, L3T, L3B, SHL, SHR,
  KY1, KY2, KY3, POS, NAV, ROOM_NAMES,
  GHOST_SPR, GHOST_DIR, GHOST_DY,
  W, H, BG, ON, RK, GH,
  K_R, K_RW, K_F, K_PK, K_CLR, K_JP, K_AT, K_PR, K_HU,
  K_CR, K_CRW, K_CJP, K_CCLR, K_CDK, K_CL, K_CL2,
  K_DK, K_RE,
  BAT_FU, BAT_FD, BAT_P, KEY_D, BOLT,
  MIM_C, MIM_CRK, MIM_O,
  SPIDER, SPIDER_T, DOOR_D, RAT,
  assert
} from '../../constants';

import { rng, rngInt, rngSpread, TAU } from '../../core/math';

import { Difficulty } from '../../difficulty';

/**
 * 洞窟ステージファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createCaveStage(ctx) {
  const { G, draw, audio, particles, hud } = ctx;
  const { $, circle, circleS, onFill, onStroke, R, txt, txtC, px, drawK, lcdFg, lcdBg } = draw;
  const { S, ea } = audio;
  const { Particles, Popups } = particles;
  const { BL, twoBeatDuration, doHurt, transTo } = hud;

  // --- 入力ヘルパー ---
  function J(k) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  // --- パーティクル・ポップアップヘルパー ---
  function addPopup(x, y, t) { Popups.add(x, y, t); }

  function initDust() {
    G.dust = [];
    for (let i = 0; i < 15; i++)
      G.dust.push({ x: rng(0, W), y: rng(30, H - 30), vx: rngSpread(.15), vy: rngSpread(.075), s: rng(1, 3), a: rng(.06, .14) });
  }

  function addStepDust(x, y) {
    Particles.spawn(G.stepDust, { x, y, n: 4, vxSpread: .6, vySpread: .4, vyBase: -.4, life: 12, s: 1.5 });
  }

  // --- 洞窟背景描画 ---
  function drawCaveBG() {
    $.fillStyle = RK; $.fillRect(0, 26, W, H - 36);
    $.fillStyle = BG;
    const mkP = (pts) => { $.beginPath(); $.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) $.lineTo(pts[i][0], pts[i][1]); $.closePath(); $.fill(); };
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
    const dL = (x, y1, y2) => { $.fillStyle = ON; $.fillRect(x, y1, 2, y2 - y1); $.fillRect(x + 18, y1, 2, y2 - y1); for (let y = y1 + 6; y < y2; y += 9) $.fillRect(x, y, 20, 2); };
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
    const sc = (x, y, w, h) => { $.fillStyle = ON; $.beginPath(); $.moveTo(x, y); $.lineTo(x + w, y); $.lineTo(x + w / 2, y + h); $.closePath(); $.fill(); };
    const sg = (x, y, w, h) => { $.fillStyle = ON; $.beginPath(); $.moveTo(x + w / 2, y); $.lineTo(x, y + h); $.lineTo(x + w, y + h); $.closePath(); $.fill(); };
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
      const chain = (x, y1, y2) => { for (let y = y1; y < y2; y += 5) { $.fillRect(x, y, 3, 3); $.fillRect(x + 1, y + 3, 1, 2); } };
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
    const mush = (x, y) => { $.beginPath(); $.arc(x, y - 2, 3, Math.PI, 0); $.fill(); $.fillRect(x - 1, y - 1, 2, 4); };
    mush(85, L1B); mush(175, L2B); mush(340, L1B); mush(310, L3B);

    // 松明（光源付き）
    const torch = (x, y) => {
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
    const drip = (x, y0, per, off) => { const t = (G.tick + off) % per;
      if (t < 15) { onFill(.5); $.fillRect(x, y0 + t * 2, 2, 3); $.globalAlpha = 1; }
      if (t === 15 && off === 0) S.drip();
      if (t >= 15 && t < 28) { const r = (t - 15) * .7; onStroke(.25); $.lineWidth = 1; circleS(x + 1, y0 + 32, r); $.globalAlpha = 1; } };
    drip(152, L1T + 12, 55, 0); drip(290, L2T + 10, 65, 20); drip(240, L3T + 4, 48, 35);

    // クリスタル（光源）
    const cry = (x, y, h) => { const gl = .18 + Math.sin(G.tick * .05 + x) * .1; onFill(gl); $.beginPath(); $.moveTo(x, y + h); $.lineTo(x + 3, y); $.lineTo(x + 6, y + h); $.closePath(); $.fill();
      $.globalAlpha = gl * .3; circle(x + 3, y + h / 2, h * .6); $.globalAlpha = 1; };
    cry(60, L1B - 16, 10); cry(340, L1B - 12, 8); cry(60, L2B - 14, 10); cry(310, L2B - 12, 8); cry(200, L3B - 10, 8); cry(300, L3B - 12, 10);

    // 蜘蛛の巣
    onStroke(.25); $.lineWidth = 1;
    const web = (x, y, sx, sy) => { $.beginPath(); $.moveTo(x, y); $.quadraticCurveTo(x + sx * .5, y + sy * .3, x + sx, y); $.stroke(); $.beginPath(); $.moveTo(x, y); $.quadraticCurveTo(x + sx * .3, y + sy * .5, x, y + sy); $.stroke(); $.beginPath(); $.moveTo(x, y); $.quadraticCurveTo(x + sx * .4, y + sy * .4, x + sx * .7, y + sy * .7); $.stroke(); };
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
    Popups.updateAndDraw();
  }

  // === 洞窟初期化 ===
  function cavInit() {
    assert(G.loop >= 1, 'cavInit: loop must be >= 1');
    G.state = 'cave'; G.beatCtr = 0; G.beatNum = 0; G.sparks = []; G.feathers = []; G.smoke = []; G.stepDust = []; Popups.clear(); G.keySpk = []; initDust();
    G.cav = {
      pos: 0, prevPos: -1, dir: 1, keys: [false, false, false], keysPlaced: 0, carrying: false,
      trapOn: false, trapBeat: 0, trapSparks: [], trapWasDanger: false,
      cageProgress: 0, cageMax: Difficulty.cageMax(G.loop), cageHolding: false,
      batPhase: 0, batBeat: 0, batHitAnim: 0, batWasDanger: false,
      mimicOpen: false, mimicBeat: 0, pryCount: 0, mimicShake: 0, mimicWasDanger: false, pryDecayT: 0,
      spiderY: 0, spiderBeat: 0, spiderWasDanger: false,
      hurtCD: 0, actAnim: 0, actType: '', walkAnim: 0, idleT: 0, won: false, wonT: 0,
      trailAlpha: 0, roomNameT: 0, roomName: 'ENTRANCE'
    };
  }

  // === 洞窟更新 ===
  function cavUpdate(nb) {
    const C = G.cav; if (C.hurtCD > 0) C.hurtCD--; if (C.actAnim > 0) C.actAnim--; if (C.batHitAnim > 0) C.batHitAnim--;
    if (C.mimicShake > 0) C.mimicShake--; if (C.walkAnim > 0) C.walkAnim--; if (C.won) { C.wonT++; if (C.wonT === 120) transTo('PRAIRIE', G.grsInit, 'DEFEAT ENEMIES'); return; }
    if (C.trailAlpha > 0) C.trailAlpha -= .03; if (C.roomNameT > 0) C.roomNameT--;
    C.idleT++;
    // 鍵所持中のきらめき
    if (C.carrying && G.tick % 4 === 0) G.keySpk.push({ x: POS[C.pos].x - 4 + rng(0, 12), y: POS[C.pos].y - 6 + rng(0, 6), life: 10 });
    if (C.actAnim <= 0) {
      const n = NAV[C.pos]; let moved = false; const oldPos = C.pos;
      if (J('arrowleft') && n.l !== undefined) { C.pos = n.l; C.dir = -1; moved = true; }
      if (J('arrowright') && n.r !== undefined) { C.pos = n.r; C.dir = 1; moved = true; }
      if (J('arrowdown') && n.d !== undefined) { C.prevPos = C.pos; C.trailAlpha = .3; C.pos = n.d; S.ladder(); C.walkAnim = 4; C.idleT = 0; addStepDust(POS[C.pos].x, POS[C.pos].y + 20); C.roomNameT = 25; C.roomName = ROOM_NAMES[C.pos]; }
      else if (J('arrowup') && n.u !== undefined) { C.prevPos = C.pos; C.trailAlpha = .3; C.pos = n.u; S.ladder(); C.walkAnim = 4; C.idleT = 0; addStepDust(POS[C.pos].x, POS[C.pos].y + 20); C.roomNameT = 25; C.roomName = ROOM_NAMES[C.pos]; }
      else if (moved) { C.prevPos = oldPos; C.trailAlpha = .3; S.step(); C.walkAnim = 3; C.idleT = 0; addStepDust(POS[C.pos].x, POS[C.pos].y + 20);
        if (ROOM_NAMES[C.pos] !== ROOM_NAMES[oldPos]) { C.roomNameT = 40; C.roomName = ROOM_NAMES[C.pos]; } } }
    // === CAGE HOLD メカニクス（TRAPの鍵、pos 9）===
    const actHeld = G.kd['z'] || G.kd[' '];
    C.cageHolding = false;
    if (C.pos === 9 && !C.keys[0] && !C.carrying && !C.trapOn && actHeld && C.hurtCD <= 0 && C.actAnim <= 0) {
      ea(); C.cageHolding = true; C.idleT = 0; C.cageProgress += 2.5;
      if (G.tick % 3 === 0) S.pry();
      if (C.cageProgress >= C.cageMax) { C.keys[0] = true; C.carrying = true; G.score += 300 * G.loop; S.grab(); C.actAnim = 8; C.actType = 'reach'; addPopup(POS[9].x, POS[9].y - 14, '+' + 300 * G.loop); C.cageProgress = 0; } }
    // ケージ未ホールド時の減衰 — 極めて遅く、ほぼ気付かない
    if (!C.cageHolding && C.cageProgress > 0) C.cageProgress = Math.max(0, C.cageProgress - .05);
    // トラップ放電時のケージ進捗への影響
    if (C.pos === 9 && C.trapOn && C.cageProgress > 0) C.cageProgress = Math.max(0, C.cageProgress - .5);

    // === MIMIC 連打減衰 — 極めて遅く、長時間不在時のみ進捗減少 ===
    if (C.pos === 5 && !C.keys[2] && !C.mimicOpen && C.pryCount > 0) { C.pryDecayT++;
      if (C.pryDecayT >= 180) { C.pryDecayT = 0; C.pryCount = Math.max(0, C.pryCount - 1); } }
    else C.pryDecayT = 0;
    if (C.pos !== 5 && C.pryCount > 0 && G.tick % 120 === 0) C.pryCount = Math.max(0, C.pryCount - 1);

    if (jAct() && C.hurtCD <= 0 && C.actAnim <= 0) { ea(); C.idleT = 0;
      if (C.pos === 4 && !C.keys[1] && !C.carrying && C.batPhase === 0) { C.keys[1] = true; C.carrying = true; G.score += 300 * G.loop; S.grab(); C.actAnim = 8; C.actType = 'atk'; C.batHitAnim = 10; C.dir = -1; addPopup(POS[4].x, POS[4].y - 14, '+' + 300 * G.loop);
        for (let i = 0; i < 8; i++) G.feathers.push({ x: POS[4].x, y: L1T + 10, vx: rngSpread(1.5), vy: -rng(0, 2) - 1, life: 12 }); }
      if (C.pos === 5 && !C.keys[2] && !C.carrying && !C.mimicOpen) {
        C.pryCount++; C.pryDecayT = 0; C.actAnim = 3; C.actType = 'pry'; S.pry(); C.mimicShake = 3; C.dir = 1;
        if (C.pryCount >= 5) { C.keys[2] = true; C.carrying = true; G.score += 300 * G.loop; S.grab(); C.actAnim = 8; C.actType = 'reach'; addPopup(POS[5].x, POS[5].y - 14, '+' + 300 * G.loop); } }
      if (C.pos === 10 && C.carrying && C.spiderY === 0) { C.carrying = false; C.keysPlaced++; G.score += 500 * G.loop; S.set(); C.actAnim = 8; C.actType = 'reach'; addPopup(POS[10].x, POS[10].y - 14, '+' + 500 * G.loop);
        if (C.keysPlaced >= 3) { C.won = true; C.wonT = 0; S.clear(); G.score += 2000 * G.loop; if (G.hp < G.maxHp) G.hp++; addPopup(W / 2, H / 2 - 30, '+' + 2000 * G.loop); } } }
    // 受動ダメージ
    if (C.hurtCD <= 0 && C.actAnim <= 0) {
      if (C.pos === 9 && C.trapOn && !C.keys[0]) { C.hurtCD = twoBeatDuration(); S.zap(); C.actAnim = 8; C.actType = 'hurt'; doHurt(); C.idleT = 0;
        for (let i = 0; i < 6; i++) C.trapSparks.push({ x: POS[9].x + rng(-10, 10), y: KY2 - 6 + rng(0, 10), vx: rngSpread(1.5), vy: -rng(0, 2) - 1, l: 6 }); }
      if (C.pos === 4 && C.batPhase === 2 && !C.keys[1]) { C.hurtCD = twoBeatDuration(); S.hit(); C.actAnim = 8; C.actType = 'hurt'; doHurt(); C.idleT = 0; }
      if (C.pos === 5 && C.mimicOpen && !C.keys[2]) { C.hurtCD = twoBeatDuration(); C.pryCount = Math.max(0, C.pryCount - 2); C.actAnim = 8; C.actType = 'hurt'; S.hit(); doHurt(); C.idleT = 0; }
      if (C.pos === 10 && C.spiderY === 2) { C.hurtCD = twoBeatDuration(); C.actAnim = 8; C.actType = 'hurt'; S.hit(); doHurt(); C.idleT = 0;
        if (C.carrying) { C.carrying = false; for (let i = 2; i >= 0; i--) { if (C.keys[i]) { C.keys[i] = false; break; } } } } }
    C.trapSparks = C.trapSparks.filter(s => { s.x += s.vx; s.y += s.vy; s.l--; return s.l > 0; });
    if (!nb) return;
    // 環境水滴
    if (G.beatNum % 4 === 0 && G.cavDrips.length < 3) {
      const dx = [85, 260, 350][rngInt(0, 2)];
      G.cavDrips.push({ x: dx + rng(-5, 5), y: L1T + 2, vy: 0, life: 40 });
      if (rng() > .6) S.drip(); }
    // ビート更新（安全インジケータ付き）
    const prevTrap = C.trapOn, prevBat = C.batPhase, prevMim = C.mimicOpen, prevSp = C.spiderY;
    C.trapBeat++; const tp = Difficulty.hazardCycle(G.loop, 6); C.trapOn = (C.trapBeat % tp) >= (tp - 2);
    C.batBeat++; const bp = Difficulty.hazardCycle(G.loop, 7); const bc = C.batBeat % bp;
    if (bc < Math.floor(bp * .4)) C.batPhase = 0; else if (bc < Math.floor(bp * .7)) C.batPhase = 1; else C.batPhase = 2;
    C.mimicBeat++; const mp = Difficulty.hazardCycle(G.loop, 6); C.mimicOpen = (C.mimicBeat % mp) >= (mp - 2);
    C.spiderBeat++; const sp = Difficulty.hazardCycle(G.loop, 7); const sc2 = C.spiderBeat % sp;
    if (sc2 < Math.floor(sp * .35)) C.spiderY = 0; else if (sc2 < Math.floor(sp * .6)) C.spiderY = 1; else C.spiderY = 2;
    // 危険→安全遷移の追跡
    if (prevTrap && !C.trapOn) C.trapWasDanger = true; else if (!C.trapOn) C.trapWasDanger && (C.trapWasDanger = !!(C.trapWasDanger = 8));
    if (prevBat === 2 && C.batPhase === 0) C.batWasDanger = 8;
    if (prevMim && !C.mimicOpen) C.mimicWasDanger = 8;
    if (prevSp === 2 && C.spiderY === 0) C.spiderWasDanger = 8;
    if (typeof C.trapWasDanger === 'number' && C.trapWasDanger > 0) C.trapWasDanger--;
    if (typeof C.batWasDanger === 'number' && C.batWasDanger > 0) C.batWasDanger--;
    if (typeof C.mimicWasDanger === 'number' && C.mimicWasDanger > 0) C.mimicWasDanger--;
    if (typeof C.spiderWasDanger === 'number' && C.spiderWasDanger > 0) C.spiderWasDanger--;
  }

  // === 洞窟描画 ===
  function cavDraw() {
    const C = G.cav; const s = SC; const wf = Math.floor(G.tick / (BL() / 2)) % 2;
    drawCaveBG();

    // 鍵ステータスHUD（上部中央）
    { const kx = W / 2 - 42, ky = 28;
      txt('CAGE', kx - 4, ky + 1, 5, C.keys[0] || C.keysPlaced > 0);
      px(KEY_D, kx + 18, ky - 2, 1, C.keys[0] || C.keysPlaced > 0);
      txt('BAT', kx + 28, ky + 1, 5, C.keys[1] || (C.keysPlaced > 1));
      px(KEY_D, kx + 44, ky - 2, 1, C.keys[1] || (C.keysPlaced > 1));
      txt('BOX', kx + 58, ky + 1, 5, C.keys[2] || (C.keysPlaced > 2));
      px(KEY_D, kx + 74, ky - 2, 1, C.keys[2] || (C.keysPlaced > 2));
    }

    // 部屋名表示
    if (C.roomNameT > 0) { const rna = Math.min(1, C.roomNameT / 15);
      $.globalAlpha = rna * .7; txtC(C.roomName, W / 2, H - 24, 6); $.globalAlpha = 1; }

    // === ゴーストスプライト ===
    for (let i = 0; i < POS.length; i++) { const p = POS[i]; const gs = GHOST_SPR[i]; const gd = GHOST_DIR[i]; const gdy = GHOST_DY[i];
      if (gd < 0) px(gs, p.x - 10, p.y + gdy, s, false, true); else px(gs, p.x - 10, p.y + gdy, s, false); }

    // === トレイルゴースト（前の位置） ===
    if (C.prevPos >= 0 && C.trailAlpha > 0) {
      const tp = POS[C.prevPos]; $.globalAlpha = C.trailAlpha;
      if (C.carrying) drawK(K_CR, tp.x - 10, tp.y - 2, s, true, C.dir);
      else drawK(K_R, tp.x - 10, tp.y, s, true, C.dir);
      $.globalAlpha = 1; }

    // BAT（pos 4）
    { const cx = POS[4].x, perchY = L1T + 2, midY = L1T + 16, swoopY = L1T + 32;
      px(BAT_P, cx - 12, perchY, s, false); px(BAT_FU, cx - 12, midY, s, false); px(BAT_FD, cx - 12, swoopY, s, false);
      R(cx + 16, swoopY + 10, 14, 3, true); px(KEY_D, cx + 18, swoopY - 1, s, false);
      if (!C.keys[1]) { px(KEY_D, cx + 18, swoopY - 1, s, true);
        if (C.batHitAnim > 0) { const yo = Math.sin(C.batHitAnim * .5) * 4; px(BAT_FD, cx - 12, perchY - 6 + yo, s, true); }
        else switch (C.batPhase) { case 0: px(BAT_P, cx - 12, perchY, s, true); break;
          case 1: px(wf ? BAT_FU : BAT_FD, cx - 12, midY, s, true); break;
          case 2: px(wf ? BAT_FU : BAT_FD, cx - 12, swoopY, s, true); break; } }
      if (C.batPhase === 2 && !C.keys[1] && Math.floor(G.tick / 4) % 2) txt('!', cx - 20, swoopY + 2, 8);
      if (C.batWasDanger > 0 && C.batPhase === 0 && !C.keys[1]) txt('○', cx - 20, perchY + 4, 7); }

    // CAGE TRAP（pos 9）— ACTホールドでケージ開放
    { const cx = POS[9].x;
      // ケージ枠（バー）
      R(cx - 22, L2T + 4, 4, L2B - L2T - 8, false); R(cx + 20, L2T + 4, 4, L2B - L2T - 8, false);
      // ケージバー（縦）
      for (let i = 0; i < 5; i++) R(cx - 18 + i * 8, L2T + 6, 2, L2B - L2T - 14, false);
      px(BOLT, cx - 16, L2T + 6, s, false); px(BOLT, cx + 8, L2T + 6, s, false); px(KEY_D, cx - 6, L2T + 20, s, false);
      if (!C.keys[0]) {
        R(cx - 22, L2T + 4, 4, L2B - L2T - 8, true); R(cx + 20, L2T + 4, 4, L2B - L2T - 8, true);
        // ケージバー（アクティブ）
        const cageOpen = C.cageProgress / C.cageMax;
        for (let i = 0; i < 5; i++) {
          const barShift = cageOpen * ((i % 2 ? -1 : 1) * 3); // ケージ開放に伴いバーが離れる
          R(cx - 18 + i * 8 + Math.round(barShift), L2T + 6, 2, L2B - L2T - 14, true); }
        px(BOLT, cx - 16, L2T + 6, s, C.trapOn); px(BOLT, cx + 8, L2T + 6, s, C.trapOn); px(KEY_D, cx - 6, L2T + 20, s, true);
        // ケージ進捗バー
        { const bx = cx - 22, by2 = L2B - 10, bw = 44, bh = 5;
          $.fillStyle = GH; $.fillRect(bx, by2, bw, bh);
          $.fillStyle = ON; $.fillRect(bx, by2, Math.floor(bw * cageOpen), bh);
          // ケージ位置でのHOLDラベル
          if (C.pos === 9 && !C.carrying && !C.trapOn)
          { if (C.cageHolding) { txt('HOLD', cx - 16, L2B - 22, 5); }
            else { if (Math.floor(G.tick / 16) % 2) txt('HOLD Z', cx - 18, L2B - 22, 5); } } }
        // 帯電
        if (C.trapOn) { onFill(.12 + Math.sin(G.tick * .9) * .06);
          for (let i = 0; i < 6; i++) $.fillRect(cx - 14 + i * 6, L2T + 30 + (i % 2 ? -3 : 3), 5, 2); $.globalAlpha = 1;
          if (Math.floor(G.tick / 3) % 2) txt('!', cx - 4, L2T + 42, 7); }
        if (C.trapWasDanger > 0 && !C.trapOn) txt('○', cx - 4, L2T + 42, 7);
        // ホールド振動
        if (C.cageHolding) { const shk = Math.floor(G.tick / 2) % 2 ? 1 : -1;
          onFill(.15); $.fillRect(cx - 24 + shk, L2T + 2, 48, 2); $.fillRect(cx - 24 - shk, L2B - 4, 48, 2); $.globalAlpha = 1; } }
      $.fillStyle = ON; C.trapSparks.forEach(sp => { $.globalAlpha = sp.l / 10; $.fillRect(sp.x, sp.y, 2, 2); }); $.globalAlpha = 1; }

    // MIMIC（pos 5、呼吸エフェクト付き）
    { const cx = POS[5].x, by = L2T + 10; const shk = C.mimicShake > 0 ? (Math.floor(G.tick / 2) % 2 ? 1 : -1) : 0;
      px(MIM_C, cx - 14, by, s, false); px(MIM_O, cx - 14, by - 6, s, false); px(KEY_D, cx - 6, by + 8, s, false);
      if (!C.keys[2]) {
        if (C.mimicOpen) { const ch = Math.floor(G.tick / 4) % 2; px(MIM_O, cx - 14 + shk, by - 6 + (ch ? 2 : 0), s, true); if (Math.floor(G.tick / 4) % 2) txt('!', cx - 20, by - 4, 7); }
        else {
          // ミミック呼吸（閉じた状態での微細パルス）
          const breathY = Math.sin(G.tick * .04) * .5;
          if (C.pryCount >= 3) px(MIM_CRK, cx - 14 + shk, by + Math.round(breathY), s, true);
          else px(MIM_C, cx - 14 + shk, by + Math.round(breathY), s, true);
          if (C.mimicWasDanger > 0) txt('○', cx - 20, by - 4, 7); }
        if (C.pryCount >= 2) px(KEY_D, cx - 6, by + 8, s, true);
        // 連打進捗バー
        { const bx = cx - 14, by2 = by + 34, bw = 30, bh = 5;
          $.fillStyle = GH; $.fillRect(bx, by2, bw, bh);
          $.fillStyle = ON; $.fillRect(bx, by2, Math.floor(bw * (C.pryCount / 5)), bh);
          if (C.pos === 5 && !C.carrying && !C.mimicOpen) { if (Math.floor(G.tick / 16) % 2) txt('MASH Z', cx - 20, by + 42, 5); } } } }

    // DOOR（pos 10、グローエフェクト付き）
    { const cx = POS[10].x, by = L3T + 4;
      // 設置済み鍵数に応じたドアの光
      if (C.keysPlaced > 0) {
        const glw = C.keysPlaced / 3;
        // 外側グロー（大きく薄い）
        onFill(.02 * glw + Math.sin(G.tick * .04) * .01 * glw);
        circle(cx, by + 14, 32 + C.keysPlaced * 6);
        // 内側グロー（既存強化）
        onFill(.06 * glw + Math.sin(G.tick * .06) * .025 * glw);
        circle(cx, by + 14, 20 + C.keysPlaced * 4);
        $.globalAlpha = 1;
        // 全鍵設置時のゴールドフラッシュ
        if (C.keysPlaced === 3) {
          const gfa = Math.sin(G.tick * .12) * .5 + .5;
          $.fillStyle = `rgba(200,180,80,${gfa * .08})`;
          circle(cx, by + 14, 26 + gfa * 8);
          $.globalAlpha = 1;
        }
      }
      px(DOOR_D, cx - 10, by, s, true);
      for (let i = 0; i < 3; i++) { const fl = i < C.keysPlaced; $.fillStyle = fl ? ON : GH; $.fillRect(cx - 6 + i * 5, by + 14, 4, 4); if (fl) { $.fillStyle = BG; $.fillRect(cx - 5 + i * 5, by + 15, 2, 2); } }
      // クモ（振動する糸付き）
      const thX = cx + 18, spTY = L3T + 2, spMY = L3T + 16, spBY = by + 18, spYA = [spTY, spMY, spBY], spCY = spYA[C.spiderY];
      // クモ移動時の糸の揺れ
      const wobble = C.spiderY > 0 ? Math.sin(G.tick * .5) * 1.5 : 0;
      $.strokeStyle = ON; $.lineWidth = 1; $.beginPath(); $.moveTo(thX + 9, L3T);
      if (C.spiderY > 0) { $.quadraticCurveTo(thX + 9 + wobble, (L3T + spCY) / 2, thX + 9, spCY + 4); }
      else { $.lineTo(thX + 9, spCY + 4); } $.stroke();
      px(SPIDER_T, thX + 2, spTY, s, false); px(SPIDER, thX, spMY, s, false); px(SPIDER, thX, spBY, s, false);
      if (C.spiderY === 0) { px(SPIDER_T, thX + 2, spTY, s, true); if (C.spiderWasDanger > 0) txt('○', thX - 2, spBY + 18, 7); }
      else { const lw = Math.floor(G.tick / 4) % 2; px(SPIDER, thX + (lw ? 0 : 1), spCY, s, true); }
      if (C.spiderY === 2 && Math.floor(G.tick / 4) % 2) txt('!', thX - 2, spBY + 18, 7); }

    // 入口矢印
    if (C.pos === 0) { onFill(.3 + Math.sin(G.tick * .1) * .15);
      $.beginPath(); $.moveTo(2, KY1 + 10); $.lineTo(14, KY1 + 4); $.lineTo(14, KY1 + 16); $.closePath(); $.fill(); $.globalAlpha = 1; }

    // 水滴
    G.cavDrips = G.cavDrips.filter(d => { d.vy += .12; d.y += d.vy; d.life--;
      if (d.life > 0 && d.y < L1B) { onFill(.3);
        $.fillRect(d.x, d.y, 2, 3 + d.vy); $.globalAlpha = 1; return true; }
      // 飛沫
      onFill(.15);
      $.fillRect(d.x - 3, d.y, 2, 1); $.fillRect(d.x + 3, d.y, 2, 1); $.fillRect(d.x, d.y - 1, 1, 1);
      $.globalAlpha = 1; return false; });

    // 浮遊ほこり
    G.dust.forEach(d => { d.x += d.vx + Math.sin(G.tick * .02 + d.a * 100) * .08; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0; if (d.y < 30) d.y = H - 60; if (d.y > H - 30) d.y = 30;
      onFill(d.a * (0.7 + Math.sin(G.tick * .04 + d.x) * .3)); $.fillRect(d.x, d.y, d.s, d.s); $.globalAlpha = 1; });

    // === アクティブナイト ===
    { const p = POS[C.pos]; const hurting = C.hurtCD > 0 && Math.floor(G.tick / 3) % 2;
      if (!hurting) { const kx = p.x - 10, ky = p.y; const d = C.dir;
        // アイドル呼吸
        const br = C.idleT > 20 ? Math.sin(G.tick * .06) * .8 : 0;
        if (C.actAnim > 0) {
          switch (C.actType) { case 'reach': px(K_RE, kx, ky - 2, s, true); break;
            case 'atk': drawK(K_AT, kx - 2, ky, s, true, d); break;
            case 'pry': drawK(K_PR, kx - 2, ky, s, true, d); break;
            case 'hurt': px(K_HU, kx, ky, s, true); break;
            default: drawK(K_R, kx, ky, s, true, d); }
        } else if (C.cageHolding) {
          // ケージホールド — 力を入れるポーズ（振動付き）
          const shk = Math.floor(G.tick / 2) % 2 ? 1 : 0;
          px(K_RE, kx + shk, ky - 2, s, true);
        } else if (C.walkAnim > 0) {
          const cp = C.pos;
          if (cp === 2 || cp === 7) px(C.walkAnim > 2 ? K_CL : K_CL2, kx, ky, s, true);
          else if (cp === 1 || cp === 8) { if (C.carrying) drawK(C.walkAnim > 1 ? K_CCLR : K_CR, kx, ky + (C.walkAnim > 1 ? -2 : 0), s, true, d);
            else drawK(C.walkAnim > 1 ? K_CLR : K_R, kx, ky + (C.walkAnim > 1 ? -2 : 0), s, true, d);
          } else if (cp === 3) { if (C.carrying) drawK(C.walkAnim > 1 ? K_CJP : K_CR, kx, ky + (C.walkAnim > 1 ? -8 : -2), s, true, d);
            else drawK(C.walkAnim > 1 ? K_JP : K_R, kx, ky + (C.walkAnim > 1 ? -8 : -2), s, true, d);
          } else if (cp === 6) { if (C.carrying) px(K_CDK, kx, ky + 4, s, true); else px(K_DK, kx, ky + 4, s, true);
          } else { if (C.carrying) drawK(C.walkAnim > 1 ? K_CR : K_CRW, kx, ky - 2, s, true, d);
            else drawK(C.walkAnim > 1 ? K_R : K_RW, kx, ky, s, true, d); }
        } else {
          const cp = C.pos; const bry = Math.round(br);
          if (cp === 0) drawK(K_PK, kx, ky + bry, s, true, 1);
          else if (cp === 1 || cp === 8) drawK(C.carrying ? K_CCLR : K_CLR, kx, ky - 2 + bry, s, true, d);
          else if (cp === 3) drawK(C.carrying ? K_CJP : K_JP, kx, ky - 6 + bry, s, true, d);
          else if (cp === 6) { if (C.carrying) px(K_CDK, kx, ky + 4, s, true); else px(K_DK, kx, ky + 4, s, true); }
          else if (cp === 4 && !C.keys[1]) drawK(K_R, kx, ky + bry, s, true, -1);
          else if (cp === 5 && !C.keys[2]) drawK(K_R, kx, ky + bry, s, true, 1);
          else if (cp === 9 && !C.keys[0]) px(K_RE, kx, ky - 2 + bry, s, true);
          else if (cp === 10) px(K_RE, kx, ky - 2 + bry, s, true);
          else if (C.carrying) drawK(K_CR, kx, ky - 2 + bry, s, true, d);
          else drawK(K_R, kx, ky + bry, s, true, d);
        } } }
    if (C.won) { const wt = C.wonT;
      // オーバーレイフェードイン
      const oa = Math.min(.90, wt / 20 * .90); $.fillStyle = `rgba(176,188,152,${oa})`; $.fillRect(0, 0, W, H);
      // フェーズ1: STAGE CLEAR（拡大）
      if (wt > 8) { const sc2 = Math.min(1, (wt - 8) / 12); $.globalAlpha = sc2;
        txtC('STAGE CLEAR', W / 2, 70, 16); $.globalAlpha = 1; }
      // フェーズ2: ステージ名（ライン付き）
      if (wt > 28) { $.globalAlpha = Math.min(1, (wt - 28) / 12);
        const lw = Math.min(100, (wt - 28) * 3); $.fillStyle = ON; $.globalAlpha *= .3;
        $.fillRect(W / 2 - lw / 2, 88, lw, 1); $.globalAlpha = Math.min(1, (wt - 28) / 12);
        txtC('— CAVE —', W / 2, 100, 8); $.globalAlpha = 1; }
      // フェーズ3: 3つの鍵が飛んでくる
      if (wt > 42) { const ka = Math.min(1, (wt - 42) / 12); $.globalAlpha = ka;
        const spread = 60 * (1 - ka) + 0; // 鍵が集まる
        px(KEY_D, W / 2 - 35 - spread * .5, 140, 3, true);
        px(KEY_D, W / 2 - 5, 140 - spread * .3, 3, true);
        px(KEY_D, W / 2 + 25 + spread * .5, 140, 3, true);
        $.globalAlpha = 1; }
      // フェーズ4: ボーナス
      if (wt > 62) { $.globalAlpha = Math.min(1, (wt - 62) / 12);
        txtC('BONUS +' + 2000 * G.loop, W / 2, 185, 8); $.globalAlpha = 1; }
      if (wt > 75 && G.hp === G.maxHp) { $.globalAlpha = Math.min(1, (wt - 75) / 10);
        txtC('HP RECOVERED', W / 2, 205, 6); $.globalAlpha = 1; }
      // フェーズ5: 次ステージ予告
      if (wt > 88) { $.globalAlpha = Math.min(1, (wt - 88) / 15);
        txtC('The prairie awaits...', W / 2, 240, 6); $.globalAlpha = 1; }
      // きらめき（継続）
      if (wt > 12) { onFill(.25 + Math.sin(G.tick * .2) * .1);
        const sx = W / 2 - 80 + (G.tick * 17) % 160, sy = 60 + (G.tick * 13 + wt * 7) % 180;
        $.fillRect(sx, sy, 2, 2); $.globalAlpha = 1; }
    }
  }

  return { init: cavInit, update: cavUpdate, draw: cavDraw };
}
