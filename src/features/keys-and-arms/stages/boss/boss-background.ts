/**
 * KEYS & ARMS — ボスステージ背景描画モジュール
 * 城の背景（壁、アーチ、柱、窓、垂れ幕、松明、玉座、床）の描画を担当する。
 */

import { W, H, BG, ON, BOS_CX, BOS_CY, SAFE_X, SAFE_Y } from '../../constants';
import { TAU } from '../../core/math';

import type { EngineContext } from '../../types';

/**
 * 城背景描画ファクトリ
 * @param ctx ゲームコンテキスト
 * @returns drawCastleBG 関数
 */
export function createBossBackground(ctx: EngineContext) {
  const { G, draw } = ctx;
  const { $, circle, onFill } = draw;

  /** 城背景描画 */
  function drawCastleBG() {
    // === 暗い石壁 ===
    // レンガパターン（より目立つ）
    onFill(.035);
    for (let y = 0; y < H; y += 12) for (let x = 0; x < W; x += 20) {
      $.fillRect(x + (Math.floor(y / 12) % 2) * 10, y, 19, 11);
    } $.globalAlpha = 1;
    // 暗い縁（部屋の奥行き）
    onFill(.04);
    $.fillRect(0, 0, 30, H); $.fillRect(W - 30, 0, 30, H); $.globalAlpha = 1;

    // === ゴシックアーチ（上部） ===
    $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = .06;
    $.beginPath(); $.moveTo(60, 0); $.quadraticCurveTo(W / 2, 30, W - 60, 0); $.stroke();
    $.beginPath(); $.moveTo(30, 0); $.quadraticCurveTo(W / 2, 18, W - 30, 0); $.stroke(); $.lineWidth = 1; $.globalAlpha = 1;
    // キーストーン
    onFill(.06); $.fillRect(W / 2 - 4, 0, 8, 12); $.globalAlpha = 1;

    // === 高い柱 ===
    for (const px2 of [0, W - 14]) {
      onFill(.09); $.fillRect(px2, 0, 14, H);
      // ベベルハイライト
      $.fillStyle = BG; $.globalAlpha = .04; $.fillRect(px2 + (px2 === 0 ? 1 : 11), 0, 2, H);
      // 柱の基部（幅広）
      onFill(.08); $.fillRect(px2 - 2, H - 30, 18, 30);
      // 柱頭部（上部ディテール）
      $.fillRect(px2 - 2, 0, 18, 8); $.globalAlpha = 1;
    }

    // === ステンドグラス窓（アーチ型） ===
    for (const [wx, wy] of [[55, 12], [W - 55, 12]]) {
      // 窓枠
      $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = .12;
      $.beginPath(); $.moveTo(wx - 14, wy + 40); $.lineTo(wx - 14, wy + 8);
      $.arc(wx, wy + 8, 14, Math.PI, 0); $.lineTo(wx + 14, wy + 40); $.closePath(); $.stroke();
      // ペイン（ステンドグラス感 — 幾何学的分割）
      $.lineWidth = 1; $.globalAlpha = .05;
      $.fillRect(wx - 12, wy + 10, 24, 28);
      $.globalAlpha = .08;
      $.beginPath(); $.moveTo(wx, wy - 4); $.lineTo(wx, wy + 40); $.stroke();
      $.beginPath(); $.moveTo(wx - 14, wy + 20); $.lineTo(wx + 14, wy + 20); $.stroke();
      $.beginPath(); $.moveTo(wx - 14, wy + 30); $.lineTo(wx + 14, wy + 30); $.stroke();
      // 窓からの光（微妙な円錐）
      onFill(.015);
      $.beginPath(); $.moveTo(wx - 10, wy + 40); $.lineTo(wx - 25, SAFE_Y); $.lineTo(wx + 25, SAFE_Y); $.lineTo(wx + 10, wy + 40); $.closePath(); $.fill();
      $.globalAlpha = 1; $.lineWidth = 1;
    }

    // === 垂れ幕（天井から） ===
    for (const [bx, bc] of [[130, .08], [W - 130, .08], [W / 2, .06]]) {
      // ポール
      onFill(bc); $.fillRect(bx - 10, 0, 20, 2);
      // 布（波打つ）
      const sway = Math.sin(G.tick * .04 + bx * .1) * 1.5;
      $.globalAlpha = bc * .8;
      $.beginPath(); $.moveTo(bx - 8, 2); $.lineTo(bx - 7 + sway, 30);
      $.lineTo(bx + sway * .5, 35); $.lineTo(bx + 7 + sway, 30); $.lineTo(bx + 8, 2); $.closePath(); $.fill();
      // 垂れ幕の紋章（ダイヤモンド）
      $.fillStyle = BG; $.globalAlpha = bc * .4; $.beginPath();
      $.moveTo(bx + sway * .3, 14); $.lineTo(bx + 4 + sway * .3, 20); $.lineTo(bx + sway * .3, 26); $.lineTo(bx - 4 + sway * .3, 20); $.closePath(); $.fill();
      $.globalAlpha = 1;
    }

    // === 松明（4本、アニメーション付き） ===
    for (const tx of [18, 68, W - 68, W - 18]) {
      onFill(.2); $.fillRect(tx - 1, 55, 3, 10);
      $.fillRect(tx - 3, 54, 7, 2);
      const fh = 5 + Math.sin(G.tick * .18 + tx) * .8; const fw = 2.5 + Math.sin(G.tick * .22 + tx + 1) * .5;
      // 外炎
      $.globalAlpha = .45 + Math.sin(G.tick * .14 + tx) * .12;
      $.beginPath(); $.ellipse(tx + .5, 53 - fh * .3, fw, fh, 0, 0, TAU); $.fill();
      // 内炎
      $.fillStyle = BG; $.globalAlpha = .18;
      $.beginPath(); $.ellipse(tx + .5, 53 - fh * .2, 1.2, fh * .5, 0, 0, TAU); $.fill();
      // グロー（壁への暖かい光）
      onFill(.035); circle(tx + .5, 52, 22);
      $.globalAlpha = .015; circle(tx + .5, 52, 40);
      // 煙
      const sy2 = 45 - ((G.tick + tx * 7) % 40) * .6; const sa = Math.max(0, .05 - ((G.tick + tx * 7) % 40) * .0013);
      onFill(sa); $.fillRect(tx + Math.sin(G.tick * .07 + tx) * 3 - 1, sy2, 2, 2);
      $.globalAlpha = 1;
    }

    // === 玉座/祭壇（ボスの後ろ） ===
    onFill(.04);
    $.fillRect(BOS_CX - 18, BOS_CY - 55, 36, 20);
    // 側面の尖塔
    $.fillRect(BOS_CX - 22, BOS_CY - 48, 6, 14); $.fillRect(BOS_CX + 16, BOS_CY - 48, 6, 14);
    // 尖った頂部
    $.beginPath(); $.moveTo(BOS_CX - 22, BOS_CY - 48); $.lineTo(BOS_CX - 19, BOS_CY - 58); $.lineTo(BOS_CX - 16, BOS_CY - 48); $.fill();
    $.beginPath(); $.moveTo(BOS_CX + 16, BOS_CY - 48); $.lineTo(BOS_CX + 19, BOS_CY - 58); $.lineTo(BOS_CX + 22, BOS_CY - 48); $.fill();
    $.globalAlpha = 1;

    // === 床 ===
    onFill(.14); $.fillRect(14, SAFE_Y + 20, W - 28, 2);
    $.globalAlpha = .05; $.fillRect(14, SAFE_Y + 22, W - 28, 1); $.globalAlpha = 1;
    // 床タイル
    for (let x = 16; x < W - 16; x += 28) {
      onFill(.025); $.fillRect(x, SAFE_Y + 23, 27, 10);
      $.fillStyle = BG; $.globalAlpha = .012; $.fillRect(x + 1, SAFE_Y + 23, 25, 1);
    } $.globalAlpha = 1;
    // カーペット（中央からボスへの道）
    onFill(.03);
    $.fillRect(SAFE_X - 16, SAFE_Y + 2, 32, 20);
    $.globalAlpha = .015; $.fillRect(SAFE_X - 14, SAFE_Y + 4, 28, 16);
    // カーペット端のタッセル
    $.globalAlpha = .04;
    $.fillRect(SAFE_X - 18, SAFE_Y + 20, 2, 4); $.fillRect(SAFE_X + 16, SAFE_Y + 20, 2, 4);
    $.fillRect(SAFE_X - 12, SAFE_Y + 20, 2, 4); $.fillRect(SAFE_X + 10, SAFE_Y + 20, 2, 4);
    $.globalAlpha = 1;

    // === 鎖（天井から） ===
    for (const cx of [38, W - 38]) {
      onFill(.05);
      for (let cy = 2; cy < 35; cy += 5) {
        $.fillRect(cx - 1, cy, 3, 4);
        $.fillStyle = BG; $.globalAlpha = .02; $.fillRect(cx, cy + 1, 1, 2); onFill(.05);
      }
      $.globalAlpha = 1;
    }
  }

  return drawCastleBG;
}
