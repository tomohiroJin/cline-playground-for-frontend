/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS -- トゥルーエンド画面モジュール（全3ループクリア後）
 * engine.ts から抽出したトゥルーエンド描画ロジック。
 */

import { W, H, BG, GH, ON, K_R, KEY_D } from '../constants';
import { TAU } from '../core/math';

/**
 * トゥルーエンド画面ファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createTrueEndScreen(ctx) {
  const { G, draw, audio, particles, hud } = ctx;
  const { $, circle, onFill, txt, txtC, px, iSlime, iGoblin, iSkel, iGem, iBoss } = draw;
  const { ea } = audio;
  const { transTo } = hud;

  // --- 入力ヘルパー ---
  function J(k) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  /** トゥルーエンド画面描画 */
  function drawTrueEnd() {
    G.teT++;
    $.fillStyle = BG; $.fillRect(0, 0, W, H); $.fillStyle = 'rgba(145,158,125,0.1)'; for (let y = 0; y < H; y += 2) $.fillRect(0, y, W, 1);
    const scroll = Math.max(0, (G.teT - 200) * .35);
    $.save(); $.translate(0, -scroll);
    $.fillStyle = ON;
    for (let i = 0; i < 25; i++) {
      const sx = (i * 47 + G.teT * .1) % W, sy = (i * 31 + Math.sin(G.teT * .02 + i) * 6) % 100 + 5 + scroll * .3;
      $.globalAlpha = .12 + Math.sin(G.teT * .04 + i * 3) * .08;
      $.fillRect(sx, sy, G.teT % (9 + i % 5) < 2 ? 3 : 2, G.teT % (9 + i % 5) < 2 ? 3 : 2);
    }
    $.globalAlpha = 1;
    const line = (start, text, y, sz) => {
      if (G.teT > start) {
        $.globalAlpha = Math.min(1, (G.teT - start) / 30); txtC(text, W / 2, y, sz || 6); $.globalAlpha = 1;
      }
    };
    line(8, 'After three arduous journeys...', 40, 8);
    line(50, 'the knight has shattered', 62, 6);
    line(65, 'every curse upon the land.', 78, 6);
    if (G.teT > 90) {
      const da = Math.min(1, (G.teT - 90) / 50);
      const bsh = da < .8 ? (1 - da) * Math.sin(G.teT * .8) * 3 : 0;
      $.globalAlpha = Math.max(0, 1 - da * 1.2);
      iBoss(W / 2 + bsh, 118, true); $.globalAlpha = 1;
      if (da < 1 && G.teT % 2 === 0) {
        onFill(.25);
        for (let i = 0; i < 3; i++) {
          const px2 = W / 2 - 22 + Math.random() * 44, py2 = 100 + Math.random() * 36;
          $.fillRect(px2, py2 - da * 30, 2, 2);
        }
        $.globalAlpha = 1;
      }
      if (da > .4) {
        $.globalAlpha = Math.min(1, (da - .4) * 2.5);
        px(K_R, W / 2 - 10, 128, 2, true);
        if (G.teT % 6 < 2) {
          $.fillStyle = ON; $.globalAlpha *= .4;
          $.fillRect(W / 2 + 12, 120, 2, 2); $.globalAlpha = Math.min(1, (da - .4) * 2.5);
        }
        $.globalAlpha = 1;
      }
    }
    if (G.teT > 170) {
      const sa = Math.min(1, (G.teT - 170) / 80);
      onFill(sa * .07);
      $.beginPath(); $.arc(W / 2, 175, 30 + sa * 40, Math.PI, 0); $.fill();
      for (let r = 0; r < 7; r++) {
        const ra = -Math.PI + r * Math.PI / 6; const rl = sa * 25;
        $.fillRect(W / 2 + Math.cos(ra) * (45 + sa * 25) - 1, 175 + Math.sin(ra) * (45 + sa * 25) - 1, 2, rl);
      }
      $.globalAlpha = sa * .03; $.fillRect(0, 150, W, 60);
      $.globalAlpha = 1;
    }
    line(195, 'The sun rises on a world reborn.', 185, 8);
    line(240, 'The caves are silent.', 225, 6);
    if (G.teT > 250) {
      $.globalAlpha = Math.min(.12, (G.teT - 250) / 40 * .12);
      $.fillStyle = ON; $.fillRect(W / 2 - 50, 240, 100, 25); $.fillStyle = BG; $.fillRect(W / 2 - 45, 243, 90, 18);
      px(KEY_D, W / 2 - 8, 248, 1, true); $.globalAlpha = 1;
    }
    line(280, 'The prairie is at peace.', 275, 6);
    if (G.teT > 290) {
      $.globalAlpha = Math.min(.12, (G.teT - 290) / 40 * .12);
      $.fillStyle = ON; $.fillRect(W / 2 - 60, 290, 120, 1);
      for (let i = 0; i < 5; i++) {
        const gx = W / 2 - 40 + i * 20;
        $.fillRect(gx, 286 - Math.random() * 3, 1, 4 + Math.random() * 2);
      }
      $.globalAlpha = 1;
    }
    line(320, 'The castle crumbles to dust.', 325, 6);
    if (G.teT > 330) {
      $.globalAlpha = Math.min(.12, (G.teT - 330) / 40 * .12);
      const crumble = Math.min(1, (G.teT - 330) / 60);
      $.fillStyle = ON;
      $.fillRect(W / 2 - 20, 335, 40 * (1 - crumble * .3), 20 * (1 - crumble * .5));
      for (let i = 0; i < 3; i++) {
        const fx = W / 2 - 15 + i * 15, fy = 340 + crumble * i * 8;
        $.fillRect(fx, fy, 3, 2);
      }
      $.globalAlpha = 1;
    }
    if (G.teT > 370) {
      const pa = Math.min(1, (G.teT - 370) / 25); $.globalAlpha = pa;
      const cy = 388;
      const spread = 80 * (1 - pa);
      px(K_R, W / 2 - 80 - spread, cy, 2, true);
      px(KEY_D, W / 2 - 50 - spread * .5, cy + 4, 2, true);
      iSlime(W / 2 - 20, cy + 6, true);
      iGoblin(W / 2 + 6, cy + 4, true);
      iSkel(W / 2 + 32 + spread * .5, cy + 4, true);
      iGem(W / 2 + 58 + spread * .5, cy + 4, true);
      iBoss(W / 2 + 84 + spread, cy + 8, true);
      $.globalAlpha = 1;
    }
    if (G.teT > 400) {
      $.globalAlpha = Math.min(.2, (G.teT - 400) / 20 * .2); $.fillStyle = ON;
      $.fillRect(W / 2 - 100, 414, 200, 1); $.globalAlpha = 1;
    }
    if (G.teT > 420) {
      $.globalAlpha = Math.min(1, (G.teT - 420) / 25);
      txtC('CONGRATULATIONS', W / 2, 440, 14); $.globalAlpha = 1;
    }
    if (G.teT > 460) {
      $.globalAlpha = Math.min(1, (G.teT - 460) / 20);
      txtC(String(G.score).padStart(7, '0'), W / 2, 472, 18); $.globalAlpha = 1;
    }
    if (G.teT > 490) {
      $.globalAlpha = Math.min(1, (G.teT - 490) / 20);
      let rk = 'C'; if (G.score > 80000) rk = 'B'; if (G.score > 150000) rk = 'A'; if (G.score > 250000) rk = 'S'; if (G.score > 400000) rk = 'SS';
      const rsz = rk === 'SS' ? 22 : (rk === 'S' ? 20 : 16);
      txtC('RANK', W / 2, 500, 8);
      txtC(rk, W / 2, 522, rsz);
      if (rk === 'SS' || rk === 'S') {
        for (let i = 0; i < 3; i++) {
          const sa2 = G.teT * .1 + i * 2.1; onFill(.3 + Math.sin(sa2) * .15);
          $.fillRect(W / 2 + Math.cos(sa2) * 25 - 1, 518 + Math.sin(sa2 + 1) * 10 - 1, 3, 3);
        }
        $.globalAlpha = Math.min(1, (G.teT - 490) / 20);
      }
      $.globalAlpha = 1;
    }
    if (G.teT > 530) {
      $.globalAlpha = Math.min(1, (G.teT - 530) / 15);
      if (G.noDmg) { txtC('PERFECT', W / 2, 555, 10); txtC('NO DAMAGE', W / 2, 572, 8); }
      else txtC('3 LOOPS CLEARED!', W / 2, 560, 10);
      $.globalAlpha = 1;
    }
    if (G.teT > 570) {
      $.globalAlpha = Math.min(1, (G.teT - 570) / 20);
      $.fillStyle = ON; $.globalAlpha *= .2; $.fillRect(W / 2 - 50, 592, 100, 1);
      $.globalAlpha = Math.min(1, (G.teT - 570) / 20);
      txtC('KEYS & ARMS', W / 2, 608, 7);
      txtC('A GAME & WATCH TRIBUTE', W / 2, 622, 5); $.globalAlpha = 1;
    }
    if (G.teT > 610) {
      $.globalAlpha = Math.min(1, (G.teT - 610) / 25);
      txtC('THANK YOU FOR PLAYING', W / 2, 650, 8); $.globalAlpha = 1;
    }
    $.restore();
    if (G.teT > 650) {
      $.fillStyle = BG; $.globalAlpha = .7; $.fillRect(0, H - 30, W, 30); $.globalAlpha = 1;
      if (Math.floor(G.teT / 16) % 2) {
        txtC('Z: CONTINUE    ESC: TITLE', W / 2, H - 14, 6);
      }
      if (jAct()) { ea(); G.loop = 4; G.noDmg = true; if (G.hp < G.maxHp) G.hp++; transTo('LOOP 4 \u2014 BEYOND', G.cavInit); }
      if (J('escape')) { G.state = 'title'; G.teT = 0; G.blink = 0; if (G.score > G.hi) { G.hi = G.score; localStorage.setItem('kaG', String(G.hi)); } }
    }
  }

  return { draw: drawTrueEnd };
}
