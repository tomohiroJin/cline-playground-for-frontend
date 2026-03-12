/**
 * KEYS & ARMS — 洞窟ステージ描画モジュール
 * キャラクター、敵、UI、勝利演出の描画を担当する。
 */

import {
  SC, L1T, L1B, L2T, L2B, L3T,
  KY1, POS,
  GHOST_SPR, GHOST_DIR, GHOST_DY,
  W, H, BG, ON, GH,
  K_R, K_RW, K_PK, K_CLR, K_JP, K_AT, K_PR, K_HU,
  K_CR, K_CRW, K_CJP, K_CCLR, K_CDK, K_CL, K_CL2,
  K_DK, K_RE,
  BAT_FU, BAT_FD, BAT_P, KEY_D, BOLT,
  MIM_C, MIM_CRK, MIM_O,
  SPIDER, SPIDER_T, DOOR_D
} from '../../constants';


import type { EngineContext } from '../../types';

/**
 * 洞窟描画ファクトリ
 * @param ctx ゲームコンテキスト
 * @param drawCaveBG 背景描画関数
 * @returns cavDraw 関数
 */
export function createCaveRenderer(ctx: EngineContext, drawCaveBG: () => void) {
  const { G, draw, hud } = ctx;
  const { $, circle, onFill, R, txt, txtC, px, drawK } = draw;
  const { BL } = hud;

  /** 洞窟描画 */
  function cavDraw() {
    const C = G.cav; const s = SC; const wf = Math.floor(G.tick / (BL() / 2)) % 2;
    drawCaveBG();

    // 鍵ステータスHUD（上部中央）
    { const kx = W / 2 - 42, ky = 28;
      txt('CAGE', kx - 4, ky + 1, 5, C.keys[0] || C.keysPlaced > 0);
      px(KEY_D, kx + 18, ky - 2, 1, C.keys[0] || C.keysPlaced > 0);
      txt('BAT', kx + 28, ky + 1, 5, C.keys[1] || (C.keysPlaced > 1));
      px(KEY_D, kx + 44, ky - 2, 1, C.keys[1] || (C.keysPlaced > 1));
      txt('BOX', kx + 58, ky + 1, 5, C.keys[2] || (C.keysPlaced > 2));
      px(KEY_D, kx + 74, ky - 2, 1, C.keys[2] || (C.keysPlaced > 2));
    }

    // 部屋名表示
    if (C.roomNameT > 0) { const rna = Math.min(1, C.roomNameT / 15);
      $.globalAlpha = rna * .7; txtC(C.roomName, W / 2, H - 24, 6); $.globalAlpha = 1; }

    // === ゴーストスプライト ===
    for (let i = 0; i < POS.length; i++) { const p = POS[i]; const gs = GHOST_SPR[i]; const gd = GHOST_DIR[i]; const gdy = GHOST_DY[i];
      if (gd < 0) px(gs, p.x - 10, p.y + gdy, s, false, true); else px(gs, p.x - 10, p.y + gdy, s, false); }

    // === トレイルゴースト（前の位置） ===
    if (C.prevPos >= 0 && C.trailAlpha > 0) {
      const tp = POS[C.prevPos]; $.globalAlpha = C.trailAlpha;
      if (C.carrying) drawK(K_CR, tp.x - 10, tp.y - 2, s, true, C.dir);
      else drawK(K_R, tp.x - 10, tp.y, s, true, C.dir);
      $.globalAlpha = 1; }

    // BAT（pos 4）
    { const cx = POS[4].x, perchY = L1T + 2, midY = L1T + 16, swoopY = L1T + 32;
      px(BAT_P, cx - 12, perchY, s, false); px(BAT_FU, cx - 12, midY, s, false); px(BAT_FD, cx - 12, swoopY, s, false);
      R(cx + 16, swoopY + 10, 14, 3, true); px(KEY_D, cx + 18, swoopY - 1, s, false);
      if (!C.keys[1]) { px(KEY_D, cx + 18, swoopY - 1, s, true);
        if (C.batHitAnim > 0) { const yo = Math.sin(C.batHitAnim * .5) * 4; px(BAT_FD, cx - 12, perchY - 6 + yo, s, true); }
        else switch (C.batPhase) { case 0: px(BAT_P, cx - 12, perchY, s, true); break;
          case 1: px(wf ? BAT_FU : BAT_FD, cx - 12, midY, s, true); break;
          case 2: px(wf ? BAT_FU : BAT_FD, cx - 12, swoopY, s, true); break; } }
      if (C.batPhase === 2 && !C.keys[1] && Math.floor(G.tick / 4) % 2) txt('!', cx - 20, swoopY + 2, 8);
      if (C.batWasDanger > 0 && C.batPhase === 0 && !C.keys[1]) txt('○', cx - 20, perchY + 4, 7); }

    // CAGE TRAP（pos 9）— ACTホールドでケージ開放
    { const cx = POS[9].x;
      // ケージ枠（バー）
      R(cx - 22, L2T + 4, 4, L2B - L2T - 8, false); R(cx + 20, L2T + 4, 4, L2B - L2T - 8, false);
      // ケージバー（縦）
      for (let i = 0; i < 5; i++) R(cx - 18 + i * 8, L2T + 6, 2, L2B - L2T - 14, false);
      px(BOLT, cx - 16, L2T + 6, s, false); px(BOLT, cx + 8, L2T + 6, s, false); px(KEY_D, cx - 6, L2T + 20, s, false);
      if (!C.keys[0]) {
        R(cx - 22, L2T + 4, 4, L2B - L2T - 8, true); R(cx + 20, L2T + 4, 4, L2B - L2T - 8, true);
        // ケージバー（アクティブ）
        const cageOpen = C.cageProgress / C.cageMax;
        for (let i = 0; i < 5; i++) {
          const barShift = cageOpen * ((i % 2 ? -1 : 1) * 3);
          R(cx - 18 + i * 8 + Math.round(barShift), L2T + 6, 2, L2B - L2T - 14, true); }
        px(BOLT, cx - 16, L2T + 6, s, C.trapOn); px(BOLT, cx + 8, L2T + 6, s, C.trapOn); px(KEY_D, cx - 6, L2T + 20, s, true);
        // ケージ進捗バー
        { const bx = cx - 22, by2 = L2B - 10, bw = 44, bh = 5;
          $.fillStyle = GH; $.fillRect(bx, by2, bw, bh);
          $.fillStyle = ON; $.fillRect(bx, by2, Math.floor(bw * cageOpen), bh);
          if (C.pos === 9 && !C.carrying && !C.trapOn)
          { if (C.cageHolding) { txt('HOLD', cx - 16, L2B - 22, 5); }
            else { if (Math.floor(G.tick / 16) % 2) txt('HOLD Z', cx - 18, L2B - 22, 5); } } }
        // 帯電
        if (C.trapOn) { onFill(.12 + Math.sin(G.tick * .9) * .06);
          for (let i = 0; i < 6; i++) $.fillRect(cx - 14 + i * 6, L2T + 30 + (i % 2 ? -3 : 3), 5, 2); $.globalAlpha = 1;
          if (Math.floor(G.tick / 3) % 2) txt('!', cx - 4, L2T + 42, 7); }
        if (C.trapWasDanger > 0 && !C.trapOn) txt('○', cx - 4, L2T + 42, 7);
        // ホールド振動
        if (C.cageHolding) { const shk = Math.floor(G.tick / 2) % 2 ? 1 : -1;
          onFill(.15); $.fillRect(cx - 24 + shk, L2T + 2, 48, 2); $.fillRect(cx - 24 - shk, L2B - 4, 48, 2); $.globalAlpha = 1; } }
      $.fillStyle = ON; C.trapSparks.forEach(sp => { $.globalAlpha = sp.l / 10; $.fillRect(sp.x, sp.y, 2, 2); }); $.globalAlpha = 1; }

    // MIMIC（pos 5、呼吸エフェクト付き）
    { const cx = POS[5].x, by = L2T + 10; const shk = C.mimicShake > 0 ? (Math.floor(G.tick / 2) % 2 ? 1 : -1) : 0;
      px(MIM_C, cx - 14, by, s, false); px(MIM_O, cx - 14, by - 6, s, false); px(KEY_D, cx - 6, by + 8, s, false);
      if (!C.keys[2]) {
        if (C.mimicOpen) { const ch = Math.floor(G.tick / 4) % 2; px(MIM_O, cx - 14 + shk, by - 6 + (ch ? 2 : 0), s, true); if (Math.floor(G.tick / 4) % 2) txt('!', cx - 20, by - 4, 7); }
        else {
          const breathY = Math.sin(G.tick * .04) * .5;
          if (C.pryCount >= 3) px(MIM_CRK, cx - 14 + shk, by + Math.round(breathY), s, true);
          else px(MIM_C, cx - 14 + shk, by + Math.round(breathY), s, true);
          if (C.mimicWasDanger > 0) txt('○', cx - 20, by - 4, 7); }
        if (C.pryCount >= 2) px(KEY_D, cx - 6, by + 8, s, true);
        // 連打進捗バー
        { const bx = cx - 14, by2 = by + 34, bw = 30, bh = 5;
          $.fillStyle = GH; $.fillRect(bx, by2, bw, bh);
          $.fillStyle = ON; $.fillRect(bx, by2, Math.floor(bw * (C.pryCount / 5)), bh);
          if (C.pos === 5 && !C.carrying && !C.mimicOpen) { if (Math.floor(G.tick / 16) % 2) txt('MASH Z', cx - 20, by + 42, 5); } } } }

    // DOOR（pos 10、グローエフェクト付き）
    { const cx = POS[10].x, by = L3T + 4;
      if (C.keysPlaced > 0) {
        const glw = C.keysPlaced / 3;
        onFill(.02 * glw + Math.sin(G.tick * .04) * .01 * glw);
        circle(cx, by + 14, 32 + C.keysPlaced * 6);
        onFill(.06 * glw + Math.sin(G.tick * .06) * .025 * glw);
        circle(cx, by + 14, 20 + C.keysPlaced * 4);
        $.globalAlpha = 1;
        if (C.keysPlaced === 3) {
          const gfa = Math.sin(G.tick * .12) * .5 + .5;
          $.fillStyle = `rgba(200,180,80,${gfa * .08})`;
          circle(cx, by + 14, 26 + gfa * 8);
          $.globalAlpha = 1;
        }
      }
      px(DOOR_D, cx - 10, by, s, true);
      for (let i = 0; i < 3; i++) { const fl = i < C.keysPlaced; $.fillStyle = fl ? ON : GH; $.fillRect(cx - 6 + i * 5, by + 14, 4, 4); if (fl) { $.fillStyle = BG; $.fillRect(cx - 5 + i * 5, by + 15, 2, 2); } }
      // クモ（振動する糸付き）
      const thX = cx + 18, spTY = L3T + 2, spMY = L3T + 16, spBY = by + 18, spYA = [spTY, spMY, spBY], spCY = spYA[C.spiderY];
      const wobble = C.spiderY > 0 ? Math.sin(G.tick * .5) * 1.5 : 0;
      $.strokeStyle = ON; $.lineWidth = 1; $.beginPath(); $.moveTo(thX + 9, L3T);
      if (C.spiderY > 0) { $.quadraticCurveTo(thX + 9 + wobble, (L3T + spCY) / 2, thX + 9, spCY + 4); }
      else { $.lineTo(thX + 9, spCY + 4); } $.stroke();
      px(SPIDER_T, thX + 2, spTY, s, false); px(SPIDER, thX, spMY, s, false); px(SPIDER, thX, spBY, s, false);
      if (C.spiderY === 0) { px(SPIDER_T, thX + 2, spTY, s, true); if (C.spiderWasDanger > 0) txt('○', thX - 2, spBY + 18, 7); }
      else { const lw = Math.floor(G.tick / 4) % 2; px(SPIDER, thX + (lw ? 0 : 1), spCY, s, true); }
      if (C.spiderY === 2 && Math.floor(G.tick / 4) % 2) txt('!', thX - 2, spBY + 18, 7); }

    // 入口矢印
    if (C.pos === 0) { onFill(.3 + Math.sin(G.tick * .1) * .15);
      $.beginPath(); $.moveTo(2, KY1 + 10); $.lineTo(14, KY1 + 4); $.lineTo(14, KY1 + 16); $.closePath(); $.fill(); $.globalAlpha = 1; }

    // 水滴
    G.cavDrips = G.cavDrips.filter(d => { d.vy += .12; d.y += d.vy; d.life--;
      if (d.life > 0 && d.y < L1B) { onFill(.3);
        $.fillRect(d.x, d.y, 2, 3 + d.vy); $.globalAlpha = 1; return true; }
      onFill(.15);
      $.fillRect(d.x - 3, d.y, 2, 1); $.fillRect(d.x + 3, d.y, 2, 1); $.fillRect(d.x, d.y - 1, 1, 1);
      $.globalAlpha = 1; return false; });

    // 浮遊ほこり
    G.dust.forEach(d => { d.x += d.vx + Math.sin(G.tick * .02 + d.a * 100) * .08; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0; if (d.y < 30) d.y = H - 60; if (d.y > H - 30) d.y = 30;
      onFill(d.a * (0.7 + Math.sin(G.tick * .04 + d.x) * .3)); $.fillRect(d.x, d.y, d.s, d.s); $.globalAlpha = 1; });

    // === アクティブナイト ===
    { const p = POS[C.pos]; const hurting = C.hurtCD > 0 && Math.floor(G.tick / 3) % 2;
      if (!hurting) { const kx = p.x - 10, ky = p.y; const d = C.dir;
        const br = C.idleT > 20 ? Math.sin(G.tick * .06) * .8 : 0;
        if (C.actAnim > 0) {
          switch (C.actType) { case 'reach': px(K_RE, kx, ky - 2, s, true); break;
            case 'atk': drawK(K_AT, kx - 2, ky, s, true, d); break;
            case 'pry': drawK(K_PR, kx - 2, ky, s, true, d); break;
            case 'hurt': px(K_HU, kx, ky, s, true); break;
            default: drawK(K_R, kx, ky, s, true, d); }
        } else if (C.cageHolding) {
          const shk = Math.floor(G.tick / 2) % 2 ? 1 : 0;
          px(K_RE, kx + shk, ky - 2, s, true);
        } else if (C.walkAnim > 0) {
          const cp = C.pos;
          if (cp === 2 || cp === 7) px(C.walkAnim > 2 ? K_CL : K_CL2, kx, ky, s, true);
          else if (cp === 1 || cp === 8) { if (C.carrying) drawK(C.walkAnim > 1 ? K_CCLR : K_CR, kx, ky + (C.walkAnim > 1 ? -2 : 0), s, true, d);
            else drawK(C.walkAnim > 1 ? K_CLR : K_R, kx, ky + (C.walkAnim > 1 ? -2 : 0), s, true, d);
          } else if (cp === 3) { if (C.carrying) drawK(C.walkAnim > 1 ? K_CJP : K_CR, kx, ky + (C.walkAnim > 1 ? -8 : -2), s, true, d);
            else drawK(C.walkAnim > 1 ? K_JP : K_R, kx, ky + (C.walkAnim > 1 ? -8 : -2), s, true, d);
          } else if (cp === 6) { if (C.carrying) px(K_CDK, kx, ky + 4, s, true); else px(K_DK, kx, ky + 4, s, true);
          } else { if (C.carrying) drawK(C.walkAnim > 1 ? K_CR : K_CRW, kx, ky - 2, s, true, d);
            else drawK(C.walkAnim > 1 ? K_R : K_RW, kx, ky, s, true, d); }
        } else {
          const cp = C.pos; const bry = Math.round(br);
          if (cp === 0) drawK(K_PK, kx, ky + bry, s, true, 1);
          else if (cp === 1 || cp === 8) drawK(C.carrying ? K_CCLR : K_CLR, kx, ky - 2 + bry, s, true, d);
          else if (cp === 3) drawK(C.carrying ? K_CJP : K_JP, kx, ky - 6 + bry, s, true, d);
          else if (cp === 6) { if (C.carrying) px(K_CDK, kx, ky + 4, s, true); else px(K_DK, kx, ky + 4, s, true); }
          else if (cp === 4 && !C.keys[1]) drawK(K_R, kx, ky + bry, s, true, -1);
          else if (cp === 5 && !C.keys[2]) drawK(K_R, kx, ky + bry, s, true, 1);
          else if (cp === 9 && !C.keys[0]) px(K_RE, kx, ky - 2 + bry, s, true);
          else if (cp === 10) px(K_RE, kx, ky - 2 + bry, s, true);
          else if (C.carrying) drawK(K_CR, kx, ky - 2 + bry, s, true, d);
          else drawK(K_R, kx, ky + bry, s, true, d);
        } } }
    if (C.won) { const wt = C.wonT;
      const oa = Math.min(.90, wt / 20 * .90); $.fillStyle = `rgba(176,188,152,${oa})`; $.fillRect(0, 0, W, H);
      if (wt > 8) { const sc2 = Math.min(1, (wt - 8) / 12); $.globalAlpha = sc2;
        txtC('STAGE CLEAR', W / 2, 70, 16); $.globalAlpha = 1; }
      if (wt > 28) { $.globalAlpha = Math.min(1, (wt - 28) / 12);
        const lw = Math.min(100, (wt - 28) * 3); $.fillStyle = ON; $.globalAlpha *= .3;
        $.fillRect(W / 2 - lw / 2, 88, lw, 1); $.globalAlpha = Math.min(1, (wt - 28) / 12);
        txtC('— CAVE —', W / 2, 100, 8); $.globalAlpha = 1; }
      if (wt > 42) { const ka = Math.min(1, (wt - 42) / 12); $.globalAlpha = ka;
        const spread = 60 * (1 - ka) + 0;
        px(KEY_D, W / 2 - 35 - spread * .5, 140, 3, true);
        px(KEY_D, W / 2 - 5, 140 - spread * .3, 3, true);
        px(KEY_D, W / 2 + 25 + spread * .5, 140, 3, true);
        $.globalAlpha = 1; }
      if (wt > 62) { $.globalAlpha = Math.min(1, (wt - 62) / 12);
        txtC('BONUS +' + 2000 * G.loop, W / 2, 185, 8); $.globalAlpha = 1; }
      if (wt > 75 && G.hp === G.maxHp) { $.globalAlpha = Math.min(1, (wt - 75) / 10);
        txtC('HP RECOVERED', W / 2, 205, 6); $.globalAlpha = 1; }
      if (wt > 88) { $.globalAlpha = Math.min(1, (wt - 88) / 15);
        txtC('The prairie awaits...', W / 2, 240, 6); $.globalAlpha = 1; }
      if (wt > 12) { onFill(.25 + Math.sin(G.tick * .2) * .1);
        const sx2 = W / 2 - 80 + (G.tick * 17) % 160, sy2 = 60 + (G.tick * 13 + wt * 7) % 180;
        $.fillRect(sx2, sy2, 2, 2); $.globalAlpha = 1; }
    }
  }

  return cavDraw;
}
