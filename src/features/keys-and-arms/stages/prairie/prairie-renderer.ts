/**
 * KEYS & ARMS — 草原ステージレンダラーモジュール
 * 草原ステージの描画（プレイヤー、敵、UI、クリア演出）を担当する。
 */

import { W, H, BG, GH, ON, GRS_LY, GRS_EX, K_F, K_R, K_AT } from '../../constants';
import { TAU } from '../../core/math';

import type { EngineContext } from '../../types';

/**
 * 草原レンダラーファクトリ
 * @param ctx ゲームコンテキスト
 * @param drawPrairieBG 背景描画関数
 * @returns grsDraw 関数
 */
export function createPrairieRenderer(ctx: EngineContext, drawPrairieBG: () => void) {
  const { G, draw, particles } = ctx;
  const { $, circle, circleS, onFill, onStroke, R, txt, txtC, px, iSlime, iGoblin, iSkel } = draw;
  const { Popups } = particles;

  /** 草原描画 */
  function grsDraw() {
    const GS = G.grs;
    drawPrairieBG();
    txtC('— PRAIRIE —', W / 2, 28, 7);

    // ガード表示
    txt('←GRD', 338, 40, 5);
    for (let i = 0; i < 3; i++) {
      R(386 + i * 14, 38, 10, 10, i < GS.guards);
      if (i < GS.guards) { $.fillStyle = ON; $.fillRect(388 + i * 14, 40, 6, 6); $.fillStyle = BG; $.fillRect(389 + i * 14, 41, 4, 4); }
    }
    if (GS.guardFlash > 0) { onFill(GS.guardFlash / 4 * .3); $.fillRect(16, 44, W - 32, 4); $.globalAlpha = 1; }

    const eDr: Record<string, (x: number, y: number, on: boolean) => void> = { slime: iSlime, goblin: iGoblin, skel: iSkel };
    const kL = ['↑', '→', '↓'];

    for (let ln = 0; ln < 3; ln++) {
      const ly = GRS_LY[ln];
      txt(kL[ln], 8, ly + 14, 10);
      px(K_F, 28, ly + 4, 2, false); px(K_AT, 28, ly + 4, 2, false);
      for (let ss = 0; ss < 4; ss++) { iSlime(GRS_EX[ss] + 65, ly + 8, false); R(GRS_EX[ss] + 73, ly + 34, 2, 6, false); }
      // デンジャーゾーン
      onFill(.03); $.fillRect(GRS_EX[0] + 58, ly, 36, 48); $.globalAlpha = 1;
      R(GRS_EX[0] + 65, ly + 38, 20, 2, false);

      // アクティブ騎士 — 攻撃 / ガード / アイドル呼吸
      const atkThis = GS.atkAnim[1] > 0 && GS.atkAnim[0] === ln;
      if (atkThis) px(K_AT, 28, ly + 4, 2, true);
      else if (GS.guardAnim > 0) px(K_AT, 28, ly + 4, 2, true);
      else { const br = G.tick > 20 ? Math.sin(G.tick * .07 + ln) * .5 : 0; px(K_F, 28, ly + 4 + br, 2, true); }
      R(28, ly + 44, W - 56, 1, false);
    }

    // レーンフラッシュ
    G.grsLaneFlash = G.grsLaneFlash.filter(f => {
      f.life--; if (f.life <= 0) return false;
      const ly = GRS_LY[f.lane]; onFill(f.life / 4 * .12);
      $.fillRect(GRS_EX[0] + 58, ly, W - GRS_EX[0] - 80, 48); $.globalAlpha = 1; return true;
    });

    // ミスのXマーク
    G.grsMiss = G.grsMiss.filter(m => {
      m.life--; if (m.life <= 0) return false;
      const ly = GRS_LY[m.lane], mx = GRS_EX[0] + 73;
      $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = m.life / 4 * .5;
      $.beginPath(); $.moveTo(mx - 5, ly + 12); $.lineTo(mx + 5, ly + 22); $.stroke();
      $.beginPath(); $.moveTo(mx + 5, ly + 12); $.lineTo(mx - 5, ly + 22); $.stroke();
      $.globalAlpha = 1; $.lineWidth = 1; return true;
    });

    // 敵の描画
    GS.ens.forEach(e => {
      if (e.dead || e.step < 0 || e.step > 3) return;
      const ly = GRS_LY[e.lane], ex = GRS_EX[e.step] + 65;
      // 出現フェードイン
      const sa = e.spawnT > 0 ? (1 - e.spawnT / 4) : 1;
      $.globalAlpha = sa;
      // 行進の揺れ
      const wobble = Math.sin(G.tick * .25 + e.lane * 2) * .8;
      eDr[e.type](ex, ly + 8 + wobble, true);

      // シフター: 方向矢印 + 点線トレイル
      if (e.beh === 'shifter' && !e.shifted && e.step >= 2) {
        const ay = ly + 20, ax2 = ex + 10; onFill(sa * (.5 + Math.sin(G.tick * .3) * .2));
        if (e.shiftDir < 0) { $.beginPath(); $.moveTo(ax2, ay - 8); $.lineTo(ax2 - 5, ay - 2); $.lineTo(ax2 + 5, ay - 2); $.closePath(); $.fill(); }
        else { $.beginPath(); $.moveTo(ax2, ay + 8); $.lineTo(ax2 - 5, ay + 2); $.lineTo(ax2 + 5, ay + 2); $.closePath(); $.fill(); }
        const tl = e.lane + e.shiftDir;
        if (tl >= 0 && tl <= 2) { $.globalAlpha = sa * .15; for (let d = 0; d < 3; d++) $.fillRect(ex + 8, ly + 20 + e.shiftDir * (8 + d * 8), 3, 3); }
        $.globalAlpha = sa;
      }

      // ダッシャー: チャージしてからリープ
      if (e.beh === 'dasher' && e.step === 2) {
        if (e.dashReady) {
          if (Math.floor(G.tick / 2) % 2) {
            onFill(sa * .35);
            $.fillRect(GRS_EX[0] + 68, ly + 20, ex - GRS_EX[0] - 60, 3); $.globalAlpha = sa;
            txt('!!', ex - 16, ly + 4, 8);
          }
          // バイブレーション
          const vx = (Math.random() - .5) * 2; eDr[e.type](ex + vx, ly + 8, true);
        } else {
          onFill(sa * .25); $.fillRect(ex - 2, ly + 34, 24, 3); $.globalAlpha = sa;
          txt('»', ex + 22, ly + 14, 6);
        }
      }

      // 着地フラッシュ
      if (e.dashFlash > 0 && e.step === 0) {
        onFill(e.dashFlash / 3 * .3);
        $.fillRect(GRS_EX[0] + 58, ly, 36, 48); $.globalAlpha = 1;
      }

      // 警告
      if (e.step === 0 && Math.floor(G.tick / 2) % 2) { $.globalAlpha = 1; txt('!', ex - 12, ly + 6, 10); }
      if (e.step === 1) { onFill(.2); $.fillRect(ex - 3, ly + 16, 3, 3); }
      $.globalAlpha = 1;
    });

    // スラッシュエフェクト（インパクトアーク）
    G.grsSlash = G.grsSlash.filter(sl => {
      sl.life--; if (sl.life <= 0) return false;
      const ly = GRS_LY[sl.lane], sx = GRS_EX[0] + 55; const p = sl.life / 6;
      $.strokeStyle = ON; $.lineWidth = 2 + p; $.globalAlpha = p;
      $.beginPath(); $.arc(sx + 20, ly + 18, 10 + ((6 - sl.life) * 5), -.8, 1.3); $.stroke();
      if (sl.hit) {
        $.lineWidth = 1; circleS(sx + 20, ly + 18, 4 + ((6 - sl.life) * 2));
        // インパクトスパーク
        if (sl.life > 3) {
          for (let sp = 0; sp < 2; sp++) {
            const sa = Math.random() * TAU;
            $.fillStyle = ON; $.fillRect(sx + 20 + Math.cos(sa) * 12, ly + 18 + Math.sin(sa) * 12, 2, 2);
          }
        }
      }
      $.globalAlpha = 1; $.lineWidth = 1; return true;
    });

    // デスパーティクル（回転付き）
    $.fillStyle = ON; G.grsDead = G.grsDead.filter(d => {
      d.x += d.vx; d.y += d.vy; d.vy += .08; d.life--;
      if (d.life > 0) {
        $.globalAlpha = d.life / 12;
        $.save(); $.translate(d.x + 1.5, d.y + 1.5); $.rotate((d.rot || 0) + G.tick * .1);
        $.fillRect(-1.5, -1.5, 3, 3); $.restore(); $.globalAlpha = 1; return true;
      } return false;
    });

    // ポップアップ
    Popups.updateAndDraw();

    // プログレスバー（完了間近でパルス）
    {
      const bx = 80, by2 = H - 16, bw = 180, bh = 8;
      $.fillStyle = GH; $.fillRect(bx, by2, bw, bh);
      const pct = Math.min(1, GS.kills / GS.goal);
      $.fillStyle = ON; $.fillRect(bx, by2, Math.floor(bw * pct), bh);
      if (pct > .75) { $.globalAlpha = .15 + Math.sin(G.tick * .2) * .1; $.fillRect(bx, by2, Math.floor(bw * pct), bh); $.globalAlpha = 1; }
      for (let i = 1; i < 4; i++) { $.fillStyle = BG; $.fillRect(bx + Math.floor(bw * i / 4), by2, 1, bh); }
      txt(GS.kills + '/' + GS.goal, bx + bw + 8, by2, 6);
    }

    // クールダウンバー
    if (GS.atkCD > 0) { onFill(.25); $.fillRect(28, GRS_LY[2] + 50, GS.atkCD * 8, 2); $.globalAlpha = 1; }

    // コンボ
    if (GS.combo > 1) {
      const csz = Math.min(14, 7 + GS.combo); const bounce = Math.sin(G.tick * .3) * 1.5;
      txtC(GS.combo + ' HIT!', W / 2, 42 + bounce, csz);
      if (GS.combo >= 3) { onFill(.06 + Math.sin(G.tick * .15) * .03); $.fillRect(W / 2 - 50, 38, 100, csz + 10); $.globalAlpha = 1; }
      if (GS.combo >= 5) {
        // 炎の筋
        for (let f = 0; f < 2; f++) {
          const fx = W / 2 - 40 + Math.random() * 80, fy = 46 + Math.random() * 8;
          onFill(.12); $.fillRect(fx, fy, 2, 3); $.globalAlpha = 1;
        }
      }
    }

    // === スウィープ準備インジケーター ===
    if (GS.sweepReady) {
      const sw = .5 + Math.sin(G.tick * .25) * .3; onFill(sw);
      txtC('★ SWEEP ★', W / 2, GRS_LY[0] - 10, 7); $.globalAlpha = 1;
      // 全デンジャーゾーンをフラッシュ
      for (let ln = 0; ln < 3; ln++) { onFill(sw * .08); $.fillRect(GRS_EX[0] + 58, GRS_LY[ln], 36, 48); $.globalAlpha = 1; }
    }

    // === スウィープフラッシュ（全レーン） ===
    if (GS.sweepFlash > 0) {
      onFill(GS.sweepFlash / 8 * .15);
      $.fillRect(20, GRS_LY[0], W - 40, GRS_LY[2] + 48 - GRS_LY[0]); $.globalAlpha = 1;
    }

    // === シールドオーブ浮上 ===
    GS.shieldOrbs.forEach(o => {
      $.globalAlpha = o.alpha;
      $.strokeStyle = ON; $.lineWidth = 2; circleS(W / 2, o.y, 7);
      onFill(o.alpha * .3); circle(W / 2, o.y, 5);
      $.globalAlpha = 1; $.lineWidth = 1;
    });

    // === 獲得シールド表示（左下、プログレスバーの下）
    if (G.earnedShields > 0) {
      $.globalAlpha = .5; txt('SHLD', 14, H - 16, 5);
      for (let i = 0; i < G.earnedShields; i++) {
        onStroke(.45);
        circleS(52 + i * 12, H - 12, 4);
        onFill(.1); circle(52 + i * 12, H - 12, 4);
      }
      $.globalAlpha = 1;
    }

    // クリア演出
    if (GS.won) {
      const wt = GS.wonT;
      const oa = Math.min(.90, wt / 20 * .90); $.fillStyle = `rgba(176,188,152,${oa})`; $.fillRect(0, 0, W, H);
      if (wt > 8) { const sc = Math.min(1, (wt - 8) / 12); $.globalAlpha = sc; txtC('STAGE CLEAR', W / 2, 70, 16); $.globalAlpha = 1; }
      if (wt > 28) {
        $.globalAlpha = Math.min(1, (wt - 28) / 12);
        const lw = Math.min(100, (wt - 28) * 3); $.fillStyle = ON; $.globalAlpha *= .3;
        $.fillRect(W / 2 - lw / 2, 88, lw, 1); $.globalAlpha = Math.min(1, (wt - 28) / 12);
        txtC('— PRAIRIE —', W / 2, 100, 8); $.globalAlpha = 1;
      }
      // 倒した敵の行進
      if (wt > 42) {
        $.globalAlpha = Math.min(1, (wt - 42) / 12);
        const ox = (wt - 42) * .8;
        iSlime(W / 2 - 80 + ox * .3, 140, true); iGoblin(W / 2 - 20, 140 - 2, true); iSkel(W / 2 + 40 - ox * .3, 140 - 2, true);
        $.globalAlpha = 1;
      }
      // 騎士の敬礼
      if (wt > 55) { $.globalAlpha = Math.min(1, (wt - 55) / 10); px(K_R, W / 2 - 10, 165, 2, true); $.globalAlpha = 1; }
      if (wt > 65) { $.globalAlpha = Math.min(1, (wt - 65) / 12); txtC('BONUS +' + 3000 * G.loop, W / 2, 205, 8); $.globalAlpha = 1; }
      if (wt > 78 && GS.maxCombo > 1) { $.globalAlpha = Math.min(1, (wt - 78) / 10); txtC('MAX COMBO: ' + GS.maxCombo, W / 2, 225, 7); $.globalAlpha = 1; }
      if (wt > 88 && G.earnedShields > 0) {
        $.globalAlpha = Math.min(1, (wt - 88) / 10);
        txtC('SHIELDS: ' + G.earnedShields + ' → CASTLE', W / 2, 242, 6);
        // シールドアイコン描画
        for (let i = 0; i < G.earnedShields; i++) { $.strokeStyle = ON; $.lineWidth = 1; circleS(W / 2 - 30 + i * 18, 256, 5); }
        $.globalAlpha = 1;
      }
      if (wt > 100) { $.globalAlpha = Math.min(1, (wt - 100) / 15); txtC('The castle looms ahead...', W / 2, 274, 6); $.globalAlpha = 1; }
      // きらめき
      if (wt > 12) {
        onFill(.25 + Math.sin(G.tick * .2) * .1);
        const sx = W / 2 - 80 + (G.tick * 17) % 160, sy = 60 + (G.tick * 13 + wt * 7) % 180;
        $.fillRect(sx, sy, 2, 2); $.globalAlpha = 1;
      }
    }
  }

  return grsDraw;
}
