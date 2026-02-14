/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS -- タイトル画面モジュール
 * engine.ts から抽出したタイトル描画・ゲーム開始ロジック。
 */

import { W, H, BG, GH, ON, K_R, BAT_FU, BAT_FD, MIM_O, SPIDER, KEY_D } from '../constants';

/**
 * タイトル画面ファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createTitleScreen(ctx) {
  const { G, draw, audio, particles, hud } = ctx;
  const { $, circle, onFill, txt, txtC, px, iSlime, iBoss, iGem } = draw;

  // --- 入力ヘルパー ---
  function J(k) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  /** タイトル画面描画 */
  function drawTitle() {
    G.blink++;
    // 背景の星
    $.fillStyle = ON;
    for (let i = 0; i < 8; i++) {
      const sx = (G.blink * (.3 + i * .1) + i * 57) % W, sy = (i * 41 + G.blink * .05) % H;
      $.globalAlpha = .04 + Math.sin(G.blink * .05 + i) * .025; $.fillRect(sx, sy, 2, 2);
    }
    $.globalAlpha = 1;
    // タイトル（微かなバウンス付き）
    const tbounce = Math.sin(G.blink * .03) * 2;
    txtC('KEYS', W / 2, 14 + tbounce * .3, 28); txtC('&', W / 2, 46, 14); txtC('ARMS', W / 2, 62 - tbounce * .3, 28);
    // タイトル影
    $.globalAlpha = .06; txtC('KEYS', W / 2 + 1, 15 + tbounce * .3, 28); txtC('ARMS', W / 2 + 1, 63 - tbounce * .3, 28); $.globalAlpha = 1;
    // 装飾ライン（端の飾り付き）
    onFill(.15); const tlw = 100 + Math.sin(G.blink * .02) * 10;
    $.fillRect(W / 2 - tlw / 2, 90, tlw, 1);
    $.fillRect(W / 2 - tlw / 2 - 2, 89, 2, 3); $.fillRect(W / 2 + tlw / 2, 89, 2, 3);
    $.globalAlpha = 1;
    // キャラクターパレード（影付き）
    $.globalAlpha = .06; px(K_R, 51, 113, 3, true); $.globalAlpha = 1;
    px(K_R, 50, 112, 3, true);
    px(BAT_FU, 110, 116, 3, G.blink % 16 < 8); px(BAT_FD, 110, 116, 3, G.blink % 16 >= 8);
    px(MIM_O, 164, 114, 3, true); px(SPIDER, 226, 120, 3, true); iSlime(274, 126, true);
    // ボス（呼吸・オーラ付き）
    const bby = 134 + Math.sin(G.blink * .05);
    onFill(.03 + Math.sin(G.blink * .04) * .015);
    circle(356, bby, 30); $.globalAlpha = 1;
    iBoss(356, bby, true);
    // 鍵＋ジェム（ゆるやかな浮遊）
    const ky = 170 + Math.sin(G.blink * .04) * 1.5;
    px(KEY_D, W / 2 - 55, ky, 3, true); px(KEY_D, W / 2 - 25, ky + Math.sin(G.blink * .04 + 1) * 1, 3, true);
    iGem(W / 2 + 6, ky - 2 + Math.sin(G.blink * .04 + 2) * 1, true); iGem(W / 2 + 30, ky + Math.sin(G.blink * .04 + 3) * 1.5, true);
    // アイテムのきらめき
    if (G.blink % 16 < 2) {
      onFill(.3);
      $.fillRect(W / 2 - 50 + Math.random() * 100, ky + Math.random() * 20, 2, 2); $.globalAlpha = 1;
    }
    // スタートプロンプト（拡大付き）
    if (Math.floor(G.blink / 18) % 2 === 0) { const ps = 8 + Math.sin(G.blink * .08) * .3; txtC('PRESS Z TO START', W / 2, 210, ps); }
    // 情報（ステージ進行）
    $.globalAlpha = .7; txtC('CAVE \u2192 PRAIRIE \u2192 CASTLE', W / 2, 236, 6);
    txtC('CLEAR 3 LOOPS!', W / 2, 250, 6); $.globalAlpha = 1;
    $.globalAlpha = .5;
    txt('CAVE:  \u2190\u2192\u2191\u2193 HOLD/MASH Z', 80, 268, 5);
    txt('FIELD: \u2191\u2192\u2193 ATK  \u2190 GRD', 80, 280, 5);
    txt('CASTLE: \u2190\u2192 Z \u2191:SHLD \u2193:CTR', 80, 292, 5);
    $.globalAlpha = .3;
    txt('ESC/RST: RETURN TO TITLE', 80, 306, 5); $.globalAlpha = 1;
    if (G.hi > 0) { $.globalAlpha = .8; txtC('HI ' + String(G.hi).padStart(7, '0'), W / 2, 312, 7); $.globalAlpha = 1; }
    if (G.cheatBuf.endsWith('jin')) { $.globalAlpha = .4; txtC('\u2014 GOD MODE \u2014', W / 2, 326, 5); $.globalAlpha = 1; }
  }

  /** ゲーム開始 */
  function startGame() {
    const cheat = G.cheatBuf.endsWith('jin'); G.cheatBuf = '';
    G.loop = 1; G.score = 0; G.dispScore = 0; G.hp = cheat ? 20 : 3; G.maxHp = cheat ? 20 : 3; G.noDmg = true; G.hurtFlash = 0; G.bgmBeat = 0; G.cavInit();
  }

  return { draw: drawTitle, startGame };
}
