/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — HUD描画・トランジション
 */
import { W, H, BG, ON } from '../constants';
import { Difficulty } from '../difficulty';

/**
 * HUD・トランジションモジュールを生成する
 * @param draw 描画ヘルパー
 * @param G ゲーム状態
 * @param audio オーディオモジュール
 */
export function createHUD(draw, G, audio) {
  const { $, onFill, R, txt, txtC, iHeart } = draw;
  const { tn } = audio;

  /** ビート長（現在のループの） */
  function BL() { return Difficulty.beatLength(G.loop); }

  /** 2ビート分の持続時間 */
  function twoBeatDuration() { return BL() * 2; }

  /** ダメージ処理 */
  function doHurt() {
    G.hp--;
    G.noDmg = false;
    G.hurtFlash = 10;
    G.shakeT = 8;
    audio.S.hit();
    if (G.hp <= 0) {
      G.state = 'over';
      audio.S.over();
      if (G.score > G.hi) { G.hi = G.score; localStorage.setItem('kaG', String(G.hi)); }
    }
  }

  /** ビート進行 */
  function doBeat() {
    G.beatCtr++;
    if (G.beatCtr >= BL()) {
      G.beatCtr = 0;
      G.beatNum++;
      audio.S.tick();
      audio.bgmTick();
      G.beatPulse = 6;
      return true;
    }
    return false;
  }

  /** HUD描画 */
  function drawHUD() {
    // スコアロールアップ
    if (G.dispScore < G.score) G.dispScore = Math.min(G.score, G.dispScore + Math.max(1, Math.floor((G.score - G.dispScore) / 8)));
    if (G.dispScore > G.score) G.dispScore = G.score;
    // ハート
    if (G.maxHp <= 5) { for (let i = 0; i < G.maxHp; i++) iHeart(W - 58 + i * 19, 4, i < G.hp); }
    else { iHeart(W - 80, 4, G.hp > 0); txt(G.hp + '/' + G.maxHp, W - 60, 6, 6); }
    const scStr = String(G.dispScore).padStart(7, '0');
    const scOld = String(Math.max(0, G.dispScore - 100)).padStart(7, '0');
    for (let i = 0; i < 7; i++) {
      const changed = scStr[i] !== scOld[i] && G.dispScore < G.score;
      if (changed) { $.globalAlpha = .6 + Math.sin(G.tick * .5) * .3; }
      txt(scStr[i], 8 + i * 13, 4, 8);
      $.globalAlpha = 1;
    }
    txt('LP' + G.loop, 8, 16, 6);
    // ビートバー
    const bl = BL(); const bp2 = G.beatCtr / bl; const bx = W / 2 - 50, by = H - 12;
    R(bx, by, 100, 7, false); R(bx, by, Math.floor(100 * bp2), 7, true);
    if (G.beatPulse > 0) {
      onFill(G.beatPulse / 6 * .2);
      $.fillRect(bx - 2, by - 2, 104, 11); $.globalAlpha = 1;
    }
    for (let i = 0; i < 4; i++) {
      const dx = bx + Math.floor(100 * (i + 1) / 4) - 1;
      $.fillStyle = G.beatNum % 4 === i ? ON : 'rgba(80,92,64,0.14)';
      $.globalAlpha = G.beatNum % 4 === i ? .4 : .15;
      $.fillRect(dx, by + 8, 3, 3); $.globalAlpha = 1;
    }
    if (G.beatPulse > 3) {
      const ba = ((G.beatPulse - 3) / 3) * .06;
      onFill(ba); $.fillRect(0, 0, W, 1); $.fillRect(0, H - 1, W, 1); $.globalAlpha = 1;
    }
  }

  /** トランジション開始 */
  function transTo(t, fn, sub) {
    G.trT = 56; G.trTxt = t; G.trFn = fn; G.trSub = sub || ''; G.bgmBeat = 0;
    if (tn) tn(200, .15, 'triangle', .03);
  }

  /** トランジション描画 */
  function drawTrans() {
    if (G.trT <= 0) return false;
    G.trT--;
    if (G.trT === 28 && G.trFn) G.trFn();
    const p = G.trT > 28 ? (56 - G.trT) / 28 : G.trT / 28;
    const wh = Math.floor(H * p);
    $.fillStyle = `rgba(176,188,152,.95)`;
    $.fillRect(0, H / 2 - wh / 2, W, wh);
    if (p > .4) {
      $.globalAlpha = (p - .4) / .6;
      txtC(G.trTxt, W / 2, H / 2 - 10, 12);
      // サブテキスト
      if (G.trSub) {
        $.globalAlpha *= .6;
        txtC(G.trSub, W / 2, H / 2 + 8, 6);
      }
      const lw = 80 * Math.min(1, (p - .4) * 3);
      $.fillStyle = ON; $.globalAlpha *= .2;
      $.fillRect(W / 2 - lw / 2, H / 2 + 18, lw, 1);
    }
    $.globalAlpha = 1;
    return true;
  }

  return { BL, twoBeatDuration, doHurt, doBeat, drawHUD, transTo, drawTrans };
}
