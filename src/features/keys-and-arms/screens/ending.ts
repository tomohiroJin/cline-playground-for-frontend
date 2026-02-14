/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS -- エンディング画面モジュール（ループ1クリア後）
 * engine.ts から抽出したエンディング描画ロジック。
 */

import { W, H, BG, ON, K_R } from '../constants';

/**
 * エンディング画面ファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createEndingScreen(ctx) {
  const { G, draw, audio, particles, hud } = ctx;
  const { $, onFill, txt, txtC, px } = draw;
  const { ea } = audio;
  const { transTo } = hud;

  // --- 入力ヘルパー ---
  function J(k) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  /** エンディング画面描画 */
  function drawEnding1() {
    G.e1T++;
    $.fillStyle = BG; $.fillRect(0, 0, W, H); $.fillStyle = 'rgba(145,158,125,0.1)'; for (let y = 0; y < H; y += 2) $.fillRect(0, y, W, 1);
    const scroll = Math.max(0, (G.e1T - 180) * .4);
    $.save(); $.translate(0, -scroll);
    // 星
    $.fillStyle = ON;
    for (let i = 0; i < 15; i++) {
      const sx = (i * 59 + G.e1T * .15) % W, sy = (i * 37 + Math.sin(G.e1T * .025 + i) * 8) % 90 + 8;
      $.globalAlpha = .15 + Math.sin(G.e1T * .04 + i * 2) * .1;
      if (G.e1T % (8 + i % 4) < 2) $.fillRect(sx, sy + scroll * .5, 2, 2);
    }
    $.globalAlpha = 1;
    const line = (start, text, y, sz) => {
      if (G.e1T > start) {
        $.globalAlpha = Math.min(1, (G.e1T - start) / 30); txtC(text, W / 2, y, sz || 6); $.globalAlpha = 1;
      }
    };
    // シーン1: 城のシルエット＋騎士が歩き出す
    if (G.e1T > 5) {
      $.globalAlpha = Math.min(1, (G.e1T - 5) / 20);
      $.fillStyle = ON; $.globalAlpha *= .12; $.fillRect(20, 168, W - 40, 2); $.globalAlpha = Math.min(1, (G.e1T - 5) / 20);
      $.fillStyle = ON; $.globalAlpha *= .15;
      $.fillRect(30, 110, 40, 58); $.fillRect(24, 100, 12, 68); $.fillRect(50, 105, 10, 63);
      $.fillRect(34, 95, 8, 5); $.fillRect(52, 98, 6, 4);
      $.fillStyle = BG; $.fillRect(40, 148, 20, 20); $.globalAlpha = 1;
    }
    if (G.e1T > 30) {
      const kx = Math.min(240, 60 + (G.e1T - 30) * .9); const walking = G.e1T < 240;
      $.globalAlpha = Math.min(1, (G.e1T - 30) / 15);
      if (walking && Math.floor(G.e1T / 4) % 2) px(K_R, kx, 148, 2, true);
      else px(K_R, kx, 148, 2, true);
      if (walking && G.e1T % 8 === 0) {
        onFill(.1);
        $.fillRect(kx - 5, 165, 3, 2); $.globalAlpha = 1;
      }
      $.globalAlpha = 1;
    }
    line(15, 'The knight emerges', W / 2 + 60, 7);
    line(40, 'from the cursed castle.', W / 2 + 60, 6);
    line(90, 'The demon lord has fallen.', W / 2, 208, 7);
    line(120, 'The six seals are restored.', W / 2, 228, 6);
    line(170, '...But a dark whisper', W / 2, 268, 7);
    line(195, 'echoes through the land.', W / 2, 288, 6);
    if (G.e1T > 200 && G.e1T < 260) {
      const dp = (G.e1T - 200) / 60;
      onFill(.04 * Math.sin(dp * Math.PI));
      $.fillRect(0, 260, W, 60); $.globalAlpha = 1;
    }
    line(230, '"The seal weakens', W / 2, 328, 6);
    line(250, 'with each passing dawn..."', W / 2, 348, 6);
    line(280, '"Stronger foes will return..."', W / 2, 388, 7);
    if (G.e1T > 290) {
      $.globalAlpha = Math.min(1, (G.e1T - 290) / 15);
      px(K_R, W / 2 - 10, 408, 2, true, true);
      $.fillStyle = ON; $.fillRect(W / 2 - 14, 396, 2, 10);
      $.globalAlpha = 1;
    }
    if (G.e1T > 340) {
      $.globalAlpha = Math.min(1, (G.e1T - 340) / 20);
      $.fillStyle = ON; $.globalAlpha *= .3; $.fillRect(W / 2 - 60, 445, 120, 1);
      $.globalAlpha = Math.min(1, (G.e1T - 340) / 20);
      txtC('LOOP 1 COMPLETE', W / 2, 462, 12); $.globalAlpha = 1;
    }
    if (G.e1T > 365) {
      $.globalAlpha = Math.min(1, (G.e1T - 365) / 15);
      txtC(String(G.score).padStart(7, '0'), W / 2, 488, 14); $.globalAlpha = 1;
    }
    if (G.e1T > 385 && G.noDmg) {
      $.globalAlpha = Math.min(.8, (G.e1T - 385) / 15);
      txtC('NO DAMAGE CLEAR', W / 2, 512, 8); $.globalAlpha = 1;
    }
    $.restore();
    if (G.e1T > 420) {
      $.fillStyle = BG; $.globalAlpha = .7; $.fillRect(0, H - 30, W, 30); $.globalAlpha = 1;
      if (Math.floor(G.e1T / 22) % 2) txtC('PRESS Z TO CONTINUE', W / 2, H - 14, 7);
      if (jAct()) { ea(); G.e1T = 0; G.loop = 2; G.noDmg = true; if (G.hp < G.maxHp) G.hp++; transTo('LOOP 2', G.cavInit); }
    }
  }

  return { draw: drawEnding1 };
}
