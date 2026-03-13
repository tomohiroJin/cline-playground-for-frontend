/**
 * KEYS & ARMS — 草原ステージ背景描画モジュール
 * 山、城、雲、花、草、レーンの描画を担当する。
 */

import { W, ON, GRS_LY, GRS_EX } from '../../constants';
import { TAU } from '../../core/math';

import type { EngineContext } from '../../types';

/**
 * 草原背景描画ファクトリ
 * @param ctx ゲームコンテキスト
 * @returns drawPrairieBG 関数
 */
export function createPrairieBackground(ctx: EngineContext) {
  const { G, draw } = ctx;
  const { $, circle, onFill, onStroke, R } = draw;

  /** 草原背景描画 */
  function drawPrairieBG() {
    // 空のグラデーション感（微妙）
    onFill(.015); $.fillRect(0, 0, W, 40); $.globalAlpha = 1;

    // 遠景の山
    onFill(.035);
    $.beginPath(); $.moveTo(0, 30); $.lineTo(50, 10); $.lineTo(100, 28); $.lineTo(150, 8); $.lineTo(200, 25);
    $.lineTo(260, 12); $.lineTo(310, 26); $.lineTo(360, 6); $.lineTo(W, 24); $.lineTo(W, 40); $.lineTo(0, 40); $.closePath(); $.fill(); $.globalAlpha = 1;

    // 前景の丘陵
    onFill(.055);
    $.beginPath(); $.moveTo(0, 36); $.quadraticCurveTo(80, 24, 160, 34); $.quadraticCurveTo(240, 20, 320, 32); $.quadraticCurveTo(380, 26, W, 30); $.lineTo(W, 42); $.lineTo(0, 42); $.closePath(); $.fill(); $.globalAlpha = 1;

    // 遠景の城シルエット（大きく、詳細に）
    onFill(.07);
    $.fillRect(350, 12, 4, 22); $.fillRect(360, 16, 10, 18); $.fillRect(372, 14, 4, 20); $.fillRect(378, 18, 6, 16);
    $.beginPath(); $.moveTo(350, 12); $.lineTo(352, 4); $.lineTo(354, 12); $.fill();
    $.beginPath(); $.moveTo(372, 14); $.lineTo(374, 6); $.lineTo(376, 14); $.fill();
    $.fillRect(354, 22, 6, 2); $.fillRect(370, 22, 8, 2);
    const fWave = Math.sin(G.tick * .1) * 2;
    $.fillRect(352, 4, 1, 4); $.fillRect(353, 4 + fWave * .3, 4, 2); $.globalAlpha = 1;

    // 木（サイズ違い）
    onFill(.06);
    circle(8, 34, 16); $.fillRect(6, 34, 4, 16);
    circle(24, 38, 8); $.fillRect(22, 38, 4, 12);
    circle(W - 12, 30, 14); $.fillRect(W - 14, 30, 4, 18);
    circle(W - 30, 36, 9); $.fillRect(W - 32, 36, 4, 14); $.globalAlpha = 1;

    // レーン間の茂み
    onFill(.04);
    for (const [bx, by] of [[60, GRS_LY[0] + 52], [180, GRS_LY[1] + 52], [320, GRS_LY[0] + 52], [400, GRS_LY[1] + 52]]) {
      $.beginPath(); $.arc(bx, by, 6, 0, TAU); $.arc(bx + 8, by - 1, 5, 0, TAU); $.arc(bx + 4, by - 3, 4, 0, TAU); $.fill();
    }
    $.globalAlpha = 1;

    // 鳥（V字型、アニメーション付き）
    onStroke(.06);
    for (let i = 0; i < 3; i++) {
      const bx = (G.tick * .4 + i * 150) % 500 - 20, by = 8 + i * 6 + Math.sin(G.tick * .12 + i * 2) * 4;
      $.beginPath(); $.moveTo(bx - 3, by + 2); $.lineTo(bx, by); $.lineTo(bx + 3, by + 2); $.stroke();
    }
    $.globalAlpha = 1;

    // 雲（3レイヤー）
    const cx1 = (G.tick * .3) % 520 - 60, cx2 = (G.tick * .2 + 200) % 540 - 70, cx3 = (G.tick * .15 + 350) % 560 - 80;
    onFill(.04);
    $.beginPath(); $.arc(cx1, 10, 8, 0, TAU); $.arc(cx1 + 10, 8, 6, 0, TAU); $.arc(cx1 + 18, 11, 7, 0, TAU); $.fill();
    $.beginPath(); $.arc(cx2, 16, 6, 0, TAU); $.arc(cx2 + 12, 14, 8, 0, TAU); $.fill();
    $.beginPath(); $.arc(cx3, 6, 5, 0, TAU); $.arc(cx3 + 8, 5, 4, 0, TAU); $.arc(cx3 + 14, 7, 5, 0, TAU); $.fill();
    $.globalAlpha = 1;

    // === レーンごと: 石畳風の道 ===
    for (let ln = 0; ln < 3; ln++) {
      const ly = GRS_LY[ln];
      onFill(.04); $.fillRect(20, ly + 42, W - 40, 6); $.globalAlpha = 1;
      onFill(.025);
      for (let cx = 25; cx < W - 25; cx += 12) $.fillRect(cx + (ln * 4) % 8, ly + 43, 4, 3); $.globalAlpha = 1;
      onFill(.12);
      $.fillRect(W - 22, ly + 20, 3, 28); $.fillRect(W - 22, ly + 28, 10, 2); $.fillRect(W - 22, ly + 36, 8, 2);
      for (let ss = 1; ss < 4; ss++) { onFill(.08); $.fillRect(GRS_EX[ss] + 74, ly + 42, 2, 6); $.globalAlpha = 1; }
      R(20, ly + 48, W - 40, 1, false);
    }

    // 騎士のバリケード（左側防衛線）
    onFill(.1);
    $.fillRect(38, GRS_LY[0] - 4, 4, GRS_LY[2] + 50 - GRS_LY[0]);
    $.fillRect(34, GRS_LY[0] + 20, 12, 2); $.fillRect(34, GRS_LY[1] + 20, 12, 2); $.fillRect(34, GRS_LY[2] + 20, 12, 2);
    $.globalAlpha = 1;

    // 花（より多様に）
    onFill(.18);
    const fl = (x: number, y: number) => { $.fillRect(x, y, 2, 2); $.fillRect(x - 1, y + 1, 1, 1); $.fillRect(x + 2, y + 1, 1, 1); $.fillRect(x, y + 2, 2, 3); };
    fl(72, GRS_LY[0] + 38); fl(190, GRS_LY[1] + 40); fl(310, GRS_LY[2] + 38);
    fl(130, GRS_LY[0] + 42); fl(260, GRS_LY[1] + 38); fl(400, GRS_LY[2] + 42);
    fl(95, GRS_LY[2] + 40); fl(230, GRS_LY[0] + 40); fl(370, GRS_LY[1] + 42); $.globalAlpha = 1;

    // アニメーション付き草（揺れ）
    G.grsGrass.forEach(g => {
      const sway = Math.sin(G.tick * .08 + g.ph) * 2.5;
      onStroke(.2); $.lineWidth = 1;
      $.beginPath(); $.moveTo(g.x, g.y); $.lineTo(g.x + sway, g.y - g.h); $.stroke();
      $.beginPath(); $.moveTo(g.x + 2, g.y); $.lineTo(g.x + 2 + sway * .7, g.y - g.h * .8); $.stroke(); $.globalAlpha = 1;
    });

    // 風の筋
    $.strokeStyle = ON; $.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const wx = (G.tick * 1.5 + i * 130) % 540 - 50, wy = GRS_LY[i % 3] + 25 + Math.sin(G.tick * .06 + i) * 8;
      $.globalAlpha = .04; $.beginPath(); $.moveTo(wx, wy); $.lineTo(wx + 20 + Math.sin(G.tick * .1) * 4, wy - 2); $.stroke();
    }
    $.globalAlpha = 1;
  }

  return drawPrairieBG;
}
