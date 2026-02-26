/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — Stage 2: Prairie
 * 3レーン防衛、コンボシステム、スウィープ攻撃
 * engine.ts から抽出したプレーリーステージモジュール。
 */

import { W, H, BG, GH, ON, RK, GRS_LY, GRS_EX, K_F, K_R, K_AT, KEY_D, assert } from '../../constants';
import { TAU, rng, rngInt } from '../../core/math';
import { Difficulty } from '../../difficulty';

/**
 * プレーリーステージのファクトリ関数
 * @param ctx ゲームコンテキスト（状態・描画・オーディオ・パーティクル・HUD）
 */
export function createPrairieStage(ctx) {
  const { G, draw, audio, particles, hud } = ctx;

  // 描画ヘルパーの分割代入
  const { $, circle, circleS, onFill, onStroke, R, txt, txtC, px, drawK, iSlime, iGoblin, iSkel } = draw;

  // オーディオの分割代入
  const { S, ea } = audio;

  // パーティクルの分割代入
  const { Particles, Popups } = particles;

  // HUDの分割代入
  const { BL, twoBeatDuration, doHurt, transTo } = hud;

  /* ================================================================
     入力ヘルパー
     ================================================================ */
  function J(k) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  /** ポップアップ追加のショートカット */
  function addPopup(x, y, t) { Popups.add(x, y, t); }

  /* ================================================================
     草原ヘルパー関数
     ================================================================ */

  /** 草の初期化 */
  function initGrass() {
    G.grsGrass = [];
    for (let i = 0; i < 30; i++) G.grsGrass.push({
      x: rng(0, W), y: GRS_LY[rngInt(0, 2)] + rng(42, 48), h: rng(3, 8), ph: rng(0, TAU)
    });
  }

  /** レーン位置にデスパーティクルを生成 — スウィープ/攻撃/ガードキル共通 */
  function grsDeathParticles(lane, n, spread) {
    const ex = GRS_EX[0] + 70, ey = GRS_LY[lane] + 14;
    Particles.spawn(G.grsDead, { x: ex, y: ey, n, vxSpread: spread, vySpread: spread * .7, life: 12, s: 3, rot: true });
  }

  /** シールドオーブドロップの確認・付与 — スウィープ/通常キル共通 */
  function grsCheckShieldDrop(GS, lane) {
    if (GS.kills >= GS.nextShieldAt && G.earnedShields < 4) {
      G.earnedShields++; GS.nextShieldAt += 5;
      GS.shieldOrbs.push({ y: GRS_LY[lane] + 20, alpha: 1, t: 0 });
      addPopup(W / 2, 20, 'SHIELD +1'); S.guard();
    }
  }

  /** キル時のコンボ加算 — スウィープ/通常パス共通 */
  function grsComboHit(GS) {
    GS.kills++; GS.combo++; GS.comboT = BL() * 5;
    if (GS.combo > GS.maxCombo) GS.maxCombo = GS.combo;
  }

  /** 敵ファクトリ — Difficultyモジュールから構成 */
  function spawnEnemy(GS) {
    const ln = rngInt(0, 2);
    if (GS.ens.some(e => e.lane === ln && e.step >= 2 && !e.dead)) return false;
    let beh = 'normal', type = 'slime'; const r = rng();
    const mix = Difficulty.grassEnemyMix(G.loop);
    if (r < mix.shifter) { beh = 'shifter'; type = 'goblin'; }
    else if (r > 1 - mix.dasher) { beh = 'dasher'; type = 'skel'; }
    let shDir = rng() < .5 ? 1 : -1;
    if (ln === 0) shDir = 1; if (ln === 2) shDir = -1;
    GS.ens.push({ lane: ln, step: 3, type, beh, dead: false,
      wait: 0, shiftDir: shDir, shifted: false, dashReady: false, dashFlash: 0, spawnT: 4 });
    GS.spawned++; return true;
  }

  /* ================================================================
     プレーリー背景描画
     ================================================================ */
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
    // 城の塔
    $.beginPath(); $.moveTo(350, 12); $.lineTo(352, 4); $.lineTo(354, 12); $.fill();
    $.beginPath(); $.moveTo(372, 14); $.lineTo(374, 6); $.lineTo(376, 14); $.fill();
    // 城壁
    $.fillRect(354, 22, 6, 2); $.fillRect(370, 22, 8, 2);
    // 塔の旗
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
      // 道路面（広く、テクスチャ付き）
      onFill(.04); $.fillRect(20, ly + 42, W - 40, 6); $.globalAlpha = 1;
      // 石畳ドット
      onFill(.025);
      for (let cx = 25; cx < W - 25; cx += 12) $.fillRect(cx + (ln * 4) % 8, ly + 43, 4, 3); $.globalAlpha = 1;
      // 右端の道標
      onFill(.12);
      $.fillRect(W - 22, ly + 20, 3, 28); $.fillRect(W - 22, ly + 28, 10, 2); $.fillRect(W - 22, ly + 36, 8, 2);
      // マイルストーンマーカー
      for (let ss = 1; ss < 4; ss++) { onFill(.08); $.fillRect(GRS_EX[ss] + 74, ly + 42, 2, 6); $.globalAlpha = 1; }
      R(20, ly + 48, W - 40, 1, false);
    }

    // 騎士のバリケード（左側防衛線）
    onFill(.1);
    $.fillRect(38, GRS_LY[0] - 4, 4, GRS_LY[2] + 50 - GRS_LY[0]); // 垂直支柱
    $.fillRect(34, GRS_LY[0] + 20, 12, 2); $.fillRect(34, GRS_LY[1] + 20, 12, 2); $.fillRect(34, GRS_LY[2] + 20, 12, 2); // 横梁
    $.globalAlpha = 1;

    // 花（より多様に）
    onFill(.18);
    const fl = (x, y) => { $.fillRect(x, y, 2, 2); $.fillRect(x - 1, y + 1, 1, 1); $.fillRect(x + 2, y + 1, 1, 1); $.fillRect(x, y + 2, 2, 3); };
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

  /* ================================================================
     プレーリー描画
     ================================================================ */
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

    const eDr = { slime: iSlime, goblin: iGoblin, skel: iSkel };
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

  /* ================================================================
     プレーリー更新
     ================================================================ */
  function grsUpdate(nb) {
    const GS = G.grs;
    if (GS.hurtCD > 0) GS.hurtCD--;
    if (GS.atkAnim[1] > 0) GS.atkAnim[1]--;
    if (GS.atkCD > 0) GS.atkCD--;
    if (GS.guardAnim > 0) GS.guardAnim--;
    if (GS.guardFlash > 0) GS.guardFlash--;
    if (GS.sweepFlash > 0) GS.sweepFlash--;
    if (GS.comboT > 0) GS.comboT--; // 表示タイマーのみ、コンボは時間でリセットしない
    // シールドオーブ浮遊アニメーション
    GS.shieldOrbs = GS.shieldOrbs.filter(o => { o.t++; o.y -= 1.5; o.alpha = Math.max(0, 1 - o.t / 20); return o.t < 20; });
    if (GS.won) { GS.wonT++; if (GS.wonT === 120) transTo('CASTLE', G.bosInit, 'SET 6 GEMS'); return; }
    GS.ens.forEach(e => { if (e.dashFlash > 0) e.dashFlash--; if (e.spawnT > 0) e.spawnT--; });

    // 攻撃 (↑→↓ = レーン 0,1,2)
    if (GS.atkCD <= 0) {
      const ak = [['arrowup', 0], ['arrowright', 1], ['arrowdown', 2]];
      for (const [k, l] of ak) {
        if (J(k)) {
          ea(); GS.atkAnim = [l, 5]; GS.atkCD = 2; S.kill();
          let hit = false;
          // スウィープ: コンボ >= 4 → step-0の全敵をヒット
          if (GS.sweepReady) {
            GS.sweepReady = false; GS.sweepFlash = 8;
            for (let i = 0; i < GS.ens.length; i++) {
              const e = GS.ens[i];
              if (!e.dead && e.step === 0) {
                e.dead = true; grsComboHit(GS);
                const pts = (200 + GS.combo * 60) * G.loop; G.score += pts; hit = true;
                addPopup(GRS_EX[0] + 75, GRS_LY[e.lane] + 4, 'SWEEP +' + pts);
                grsDeathParticles(e.lane, 10, 2);
                G.grsSlash.push({ lane: e.lane, life: 6, hit: true });
              }
            }
            if (hit) S.combo(8);
            GS.combo = 0; GS.comboT = 0;
            grsCheckShieldDrop(GS, l);
          } else {
            // 通常の単レーン攻撃
            for (let i = 0; i < GS.ens.length; i++) {
              const e = GS.ens[i];
              if (!e.dead && e.lane === l && e.step === 0) {
                e.dead = true; grsComboHit(GS);
                if (GS.combo > 1) S.combo(Math.min(GS.combo, 8));
                const pts = (100 + GS.combo * 40) * G.loop; G.score += pts; hit = true;
                addPopup(GRS_EX[0] + 75, GRS_LY[l] + 4, GS.combo > 2 ? pts + ' x' + GS.combo : '+' + pts);
                grsDeathParticles(l, 8, 1.5);
                break;
              }
            }
            G.grsSlash.push({ lane: l, life: 6, hit });
            if (!hit) { G.grsMiss.push({ lane: l, life: 5 }); GS.combo = 0; GS.sweepReady = false; }
            if (hit) grsCheckShieldDrop(GS, l);
          }
          // コンボ4でスウィープ発動
          if (GS.combo >= 4 && !GS.sweepReady) { GS.sweepReady = true; S.gem(); }
          break;
        }
      }
    }

    // ガード (←) — 攻撃と同ティックで使用可能
    if (J('arrowleft') && GS.guards > 0 && GS.atkCD <= 0) {
      ea();
      for (let i = 0; i < GS.ens.length; i++) {
        const e = GS.ens[i];
        if (!e.dead && e.step === 0) {
          e.dead = true; GS.kills++; G.score += 50 * G.loop;
          addPopup(GRS_EX[0] + 75, GRS_LY[e.lane] + 4, '+' + 50 * G.loop);
          grsDeathParticles(e.lane, 4, 1);
          break;
        }
      }
      GS.guards--; GS.guardAnim = 6; GS.guardFlash = 4; GS.atkCD = 3; S.guard();
    }

    if (!nb) return;
    GS.ens = GS.ens.filter(e => !e.dead);

    // 騎士に到達した敵
    for (let i = GS.ens.length - 1; i >= 0; i--) {
      if (GS.ens[i].step <= -1) {
        GS.ens[i].dead = true;
        if (GS.hurtCD <= 0) { GS.hurtCD = twoBeatDuration(); GS.combo = 0; doHurt(); }
      }
    }

    // 行動別の敵移動
    GS.ens.forEach(e => {
      if (e.dead || e.spawnT > 0) return;
      if (e.beh === 'dasher') {
        if (e.step === 2 && !e.dashReady) { e.dashReady = true; e.dashFlash = 4; return; }
        if (e.dashReady) { e.step = 0; e.dashReady = false; e.dashFlash = 3; G.grsLaneFlash.push({ lane: e.lane, life: 4 }); return; }
      }
      if (e.beh === 'shifter' && e.step === 2 && !e.shifted) {
        e.shifted = true; const nl = e.lane + e.shiftDir;
        if (nl >= 0 && nl <= 2) { G.grsLaneFlash.push({ lane: e.lane, life: 3 }); e.lane = nl; }
      }
      if (e.wait > 0) { e.wait--; return; }
      e.step--;
    });

    // スポーン余剰
    if (GS.spawned < GS.maxSpawn && !GS.won) {
      const iv = Math.max(1, 3 - Math.floor((G.loop - 1) / 1));
      if (G.beatNum % iv === 0) spawnEnemy(GS);
      if (G.loop >= 2 && G.beatNum % 3 === 1 && GS.spawned < GS.maxSpawn) spawnEnemy(GS);
      if (G.loop >= 4 && G.beatNum % 4 === 2 && GS.spawned < GS.maxSpawn) spawnEnemy(GS);
    }

    GS.ens = GS.ens.filter(e => !e.dead);
    if (GS.kills >= GS.goal && !GS.won) { GS.won = true; GS.wonT = 0; S.clear(); G.score += 3000 * G.loop; if (G.hp < G.maxHp) G.hp++; }
  }

  /* ================================================================
     プレーリー初期化
     ================================================================ */
  function grsInit() {
    assert(G.loop >= 1, 'grsInit: loop must be >= 1');
    G.state = 'grass'; G.beatCtr = 0; G.beatNum = 0;
    G.grsSlash = []; G.grsDead = []; G.grsLaneFlash = []; G.grsMiss = [];
    Popups.clear(); initGrass();
    const g = Difficulty.grassGoal(G.loop); G.earnedShields = 0;
    G.grs = {
      ens: [], kills: 0, goal: g, maxSpawn: Math.floor(g * 1.6) + 4, spawned: 0, guards: 3,
      atkAnim: [-1, 0], atkCD: 0, guardAnim: 0, guardFlash: 0, hurtCD: 0,
      combo: 0, comboT: 0, maxCombo: 0, won: false, wonT: 0,
      shieldOrbs: [], nextShieldAt: 5,
      sweepReady: false, sweepFlash: 0
    };
  }

  /* ================================================================
     公開API
     ================================================================ */
  return { init: grsInit, update: grsUpdate, draw: grsDraw };
}
