/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS -- ゲームオーバー画面モジュール
 * engine.ts から抽出したゲームオーバー描画ロジック。
 */

import { W, H, BG, ON, K_HU } from '../constants';
import { TAU } from '../core/math';

/**
 * ゲームオーバー画面ファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createGameOverScreen(ctx) {
  const { G, draw, audio, particles, hud } = ctx;
  const { $, onFill, txt, txtC, px, circle } = draw;
  const { S, ea } = audio;

  // --- 入力ヘルパー ---
  function J(k) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  /** ゲームオーバー画面描画 */
  function drawOver() {
    G.blink++;
    // 中央から放射するひび割れ
    if (G.blink > 3) {
      $.strokeStyle = ON; $.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * TAU / 5 + .3;
        const len = Math.min(80, (G.blink - 3) * 2);
        $.globalAlpha = .03 + Math.sin(G.blink * .06 + i) * .01;
        $.beginPath(); $.moveTo(W / 2, 120);
        $.lineTo(W / 2 + Math.cos(a) * len, 120 + Math.sin(a) * len); $.stroke();
      }
      $.globalAlpha = 1;
    }
    // 倒れた騎士（影付き）
    if (G.blink > 10) {
      $.globalAlpha = Math.min(1, (G.blink - 10) / 20);
      $.fillStyle = ON; $.globalAlpha *= .08; $.beginPath(); $.ellipse(W / 2, 195, 14, 4, 0, 0, TAU); $.fill(); // 影
      $.globalAlpha = Math.min(1, (G.blink - 10) / 20); px(K_HU, W / 2 - 10, 178, 2, true); $.globalAlpha = 1;
    }
    // タイトル（強調付き）
    if (G.blink > 5) {
      const a = Math.min(1, (G.blink - 5) / 15); $.globalAlpha = a;
      txtC('GAME OVER', W / 2, 36, 20);
      // タイトル影
      $.globalAlpha = a * .08; txtC('GAME OVER', W / 2 + 1, 37, 20); $.globalAlpha = 1;
    }
    // ライン
    if (G.blink > 15) {
      $.globalAlpha = Math.min(.3, (G.blink - 15) / 20 * .3); $.fillStyle = ON;
      const lw = Math.min(140, (G.blink - 15) * 3); $.fillRect(W / 2 - lw / 2, 64, lw, 1);
      $.fillRect(W / 2 - lw / 2 - 2, 63, 2, 3); $.fillRect(W / 2 + lw / 2, 63, 2, 3);
      $.globalAlpha = 1;
    }
    // スコア（大）
    if (G.blink > 20) { $.globalAlpha = Math.min(1, (G.blink - 20) / 15);
      txtC(String(G.score).padStart(7, '0'), W / 2, 80, 16); $.globalAlpha = 1; }
    if (G.blink > 30) { $.globalAlpha = Math.min(1, (G.blink - 30) / 12);
      txtC('LOOP ' + G.loop, W / 2, 112, 9); $.globalAlpha = 1; }
    if (G.blink > 38 && G.score >= G.hi && G.score > 0) {
      $.globalAlpha = Math.min(1, (G.blink - 38) / 10);
      if (Math.floor(G.blink / 6) % 2) { txtC('\u2605 NEW HIGH SCORE! \u2605', W / 2, 136, 7); }
      else { txtC('NEW HIGH SCORE!', W / 2, 136, 7); }
      $.globalAlpha = 1;
    }
    if (G.blink > 45) { $.globalAlpha = Math.min(1, (G.blink - 45) / 12);
      txtC('HI ' + String(G.hi).padStart(7, '0'), W / 2, 158, 7); $.globalAlpha = 1; }
    // リトライプロンプト
    if (G.blink > 70) {
      const ra = .6 + Math.sin(G.blink * .08) * .3; $.globalAlpha = Math.floor(G.blink / 18) % 2 === 0 ? ra : 0;
      txtC('PRESS Z TO RETRY', W / 2, 260, 7); $.globalAlpha = 1;
    }
    if (G.blink > 70 && (jAct() || J('enter'))) { ea(); G.startGame(); }
  }

  return { draw: drawOver };
}
