/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — Canvas描画ユーティリティ
 * LCD風描画ヘルパー関数群。
 */
import { ON, BG, GH } from '../constants';
import { TAU } from './math';

/**
 * 描画ヘルパーモジュールを生成する
 * @param $ CanvasRenderingContext2D
 */
export function createRendering($) {
  /** LCD on/off カラー */
  const lcdFg = (on) => on ? ON : GH;
  const lcdBg = (on) => on ? BG : 'rgba(176,188,152,0.3)';

  /** 塗りつぶし円 */
  function circle(x, y, r) {
    $.beginPath(); $.arc(x, y, r, 0, TAU); $.fill();
  }

  /** ストローク円 */
  function circleS(x, y, r) {
    $.beginPath(); $.arc(x, y, r, 0, TAU); $.stroke();
  }

  /** ON色フィル（アルファ指定） */
  function onFill(alpha) { $.fillStyle = ON; $.globalAlpha = alpha; }

  /** ON色ストローク（アルファ・線幅指定） */
  function onStroke(alpha, lw = 1) { $.strokeStyle = ON; $.lineWidth = lw; $.globalAlpha = alpha; }

  /** LCD矩形描画 */
  function R(a, b, w, h, on) { $.fillStyle = lcdFg(on); $.fillRect(Math.round(a), Math.round(b), w, h); }

  /** テキスト描画 */
  function txt(s, a, b, sz, on, al) {
    $.fillStyle = lcdFg(on === undefined || on);
    $.font = (sz || 8) + 'px "Press Start 2P"'; $.textAlign = al || 'left'; $.textBaseline = 'top';
    $.fillText(s, Math.round(a), Math.round(b));
  }

  /** 中央揃えテキスト */
  function txtC(s, a, b, sz, on) { txt(s, a, b, sz, on, 'center'); }

  /** スプライトピクセル描画。flip=trueで左右反転 */
  function px(data, dx, dy, s, on, flip) {
    const w = data[0].length;
    for (let r = 0; r < data.length; r++) for (let c = 0; c < w; c++) {
      const v = data[r][flip ? w - 1 - c : c];
      if (v === 1) { $.fillStyle = lcdFg(on); $.fillRect(dx + c * s, dy + r * s, s, s); }
      if (v === 2) { $.fillStyle = lcdBg(on); $.fillRect(dx + c * s, dy + r * s, s, s); }
    }
  }

  function drawK(spr, x, y, s, on, dir) { px(spr, x, y, s, on, dir < 0); }

  /* ============ アイコン描画関数 ============ */
  function iHeart(a, b, on) {
    $.fillStyle = lcdFg(on); $.beginPath(); $.arc(a + 4, b + 4, 4, 0, TAU); $.arc(a + 12, b + 4, 4, 0, TAU); $.fill();
    $.beginPath(); $.moveTo(a, b + 6); $.lineTo(a + 8, b + 14); $.lineTo(a + 16, b + 6); $.fill();
  }
  function iGem(a, b, on) {
    $.fillStyle = lcdFg(on); $.beginPath(); $.moveTo(a + 8, b); $.lineTo(a + 16, b + 9); $.lineTo(a + 8, b + 18);
    $.lineTo(a, b + 9); $.closePath(); $.fill();
    if (on) { $.fillStyle = BG; $.fillRect(a + 5, b + 5, 4, 4); }
  }
  function iSlime(a, b, on) {
    $.fillStyle = lcdFg(on); $.beginPath(); $.ellipse(a + 10, b + 12, 10, 8, 0, 0, TAU); $.fill();
    $.fillStyle = on ? BG : GH; $.fillRect(a + 4, b + 9, 4, 3); $.fillRect(a + 12, b + 9, 4, 3);
  }
  function iGoblin(a, b, on) {
    $.fillStyle = lcdFg(on); $.fillRect(a + 3, b, 14, 10); $.fillRect(a - 1, b + 3, 5, 4); $.fillRect(a + 16, b + 3, 5, 4);
    $.fillRect(a + 2, b + 11, 16, 10); $.fillRect(a + 4, b + 22, 5, 5); $.fillRect(a + 11, b + 22, 5, 5);
    $.fillStyle = on ? BG : GH; $.fillRect(a + 5, b + 3, 4, 3); $.fillRect(a + 11, b + 3, 4, 3);
  }
  function iSkel(a, b, on) {
    $.fillStyle = lcdFg(on); $.fillRect(a + 3, b, 14, 10); $.fillRect(a + 8, b + 10, 4, 12);
    $.fillRect(a + 2, b + 12, 16, 2); $.fillRect(a + 2, b + 16, 16, 2); $.fillRect(a + 4, b + 22, 5, 6); $.fillRect(a + 11, b + 22, 5, 6);
    $.fillStyle = on ? BG : GH; $.fillRect(a + 5, b + 2, 4, 4); $.fillRect(a + 11, b + 2, 4, 4); $.fillRect(a + 7, b + 7, 6, 2);
  }
  function iBoss(a, b, on) {
    $.fillStyle = lcdFg(on); circle(a, b, 24); $.fillStyle = lcdBg(on); circle(a, b, 18);
    $.fillStyle = lcdFg(on); circle(a, b - 2, 12);
    $.fillStyle = on ? BG : GH; $.fillRect(a - 9, b - 6, 4, 4); $.fillRect(a - 2, b - 6, 4, 4); $.fillRect(a + 5, b - 6, 4, 4);
    $.fillRect(a - 4, b + 3, 8, 3); $.fillStyle = lcdFg(on);
    $.beginPath(); $.moveTo(a - 11, b - 12); $.lineTo(a - 7, b - 22); $.lineTo(a - 3, b - 12); $.fill();
    $.beginPath(); $.moveTo(a + 3, b - 12); $.lineTo(a + 7, b - 22); $.lineTo(a + 11, b - 12); $.fill();
  }
  function iArmDown(a, b, on) {
    $.fillStyle = lcdFg(on); $.fillRect(a + 2, b, 6, 28); $.fillRect(a - 2, b + 26, 5, 5);
    $.fillRect(a + 7, b + 26, 5, 5); $.fillRect(a, b + 30, 10, 3);
  }
  function iArmUp(a, b, on) {
    $.fillStyle = lcdFg(on); $.fillRect(a + 2, b, 6, 12); $.fillRect(a, b + 10, 10, 4);
  }

  return {
    $, lcdFg, lcdBg,
    circle, circleS, onFill, onStroke,
    R, txt, txtC, px, drawK,
    iHeart, iGem, iSlime, iGoblin, iSkel, iBoss, iArmDown, iArmUp
  };
}
