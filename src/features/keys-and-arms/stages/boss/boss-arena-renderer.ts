/**
 * ボスアリーナレンダラー
 * 環境装飾、リングパス、移動プレビュー、デンジャーゾーン、腕の描画を担当。
 */

import {
  W, H, ON,
  BOS_CX, BOS_CY, BOS_R, SAFE_X, SAFE_Y, PED_ANG, PED_POS,
  K_F,
} from '../../constants';
import { TAU } from '../../core/math';
import type { EngineContext } from '../../types';
import { playerXY } from './boss-helpers';

/**
 * ボスアリーナレンダラーファクトリ
 * @returns drawBossArena 関数
 */
export function createBossArenaRenderer(ctx: EngineContext) {
  const { G, draw } = ctx;
  const { $, circle, circleS, onFill, onStroke, txt, px } = draw;

  return function drawBossArena() {
    const B = G.bos;

    // === 環境ダンジョン装飾 ===
    $.fillStyle = ON;
    for (let i = 0; i < 10; i++) {
      const dx = (G.tick * .15 + i * 47) % W, dy = (G.tick * .08 + i * 33 + Math.sin(G.tick * .02 + i * 1.7) * 20) % H;
      $.globalAlpha = .04 + Math.sin(G.tick * .03 + i * 2) * .02;
      $.fillRect(dx, dy, 1 + ((i % 3 === 0) ? 1 : 0), 1);
    } $.globalAlpha = 1;

    // 壁のドクロ装飾
    for (const [sx, sy] of [[22, 90], [W - 22, 90], [22, 200], [W - 22, 200]]) {
      onFill(.06); circle(sx, sy, 5);
      $.fillRect(sx - 3, sy + 4, 6, 3);
      $.fillStyle = 'rgba(176,188,152,1)'; $.globalAlpha = .04;
      $.fillRect(sx - 2, sy - 1, 2, 2); $.fillRect(sx + 1, sy - 1, 2, 2);
      $.globalAlpha = 1;
    }

    // 床の魔法陣
    onStroke(.03 + Math.sin(G.tick * .04) * .01);
    circleS(BOS_CX, BOS_CY, BOS_R + 22);
    $.globalAlpha = .025; circleS(BOS_CX, BOS_CY, BOS_R - 10);
    for (let i = 0; i < 6; i++) {
      const a1 = -Math.PI / 2 + i * Math.PI / 3, a2 = -Math.PI / 2 + (i + 2) * Math.PI / 3;
      const r2 = BOS_R + 18;
      $.globalAlpha = .02; $.beginPath();
      $.moveTo(BOS_CX + Math.cos(a1) * r2, BOS_CY + Math.sin(a1) * r2);
      $.lineTo(BOS_CX + Math.cos(a2) * r2, BOS_CY + Math.sin(a2) * r2); $.stroke();
    }
    $.globalAlpha = 1;

    // ルーン文字
    for (let i = 0; i < 6; i++) {
      const midA = PED_ANG[i] + Math.PI / 6;
      const rx = BOS_CX + Math.cos(midA) * (BOS_R + 18), ry = BOS_CY + Math.sin(midA) * (BOS_R + 18);
      onFill(.04 + Math.sin(G.tick * .06 + i * 1.1) * .015);
      $.fillRect(rx - 1, ry - 3, 2, 6); $.fillRect(rx - 3, ry - 1, 6, 2);
    }
    $.globalAlpha = 1;

    // 魔法のきらめき
    for (let i = 0; i < 4; i++) {
      const pi2 = Math.floor((G.tick * .07 + i * 1.5) % 6); const pp = PED_POS[pi2];
      if (B.peds[pi2] > 0) {
        const sparkX = pp.x - 8 + ((G.tick * 1.3 + i * 37) % 16), sparkY = pp.y - 20 - ((G.tick * .5 + i * 19) % 30);
        onFill(.08 + Math.sin(G.tick * .2 + i) * .04);
        $.fillRect(sparkX, sparkY, 1, 1); $.globalAlpha = 1;
      }
    }

    // 床のひび割れ
    onStroke(.025);
    for (let i = 0; i < 5; i++) {
      const ca = -Math.PI / 2 + i * TAU / 5 + .5;
      $.beginPath(); $.moveTo(BOS_CX + Math.cos(ca) * 20, BOS_CY + Math.sin(ca) * 20);
      $.lineTo(BOS_CX + Math.cos(ca + .1) * 55, BOS_CY + Math.sin(ca + .1) * 55); $.stroke();
    }
    $.globalAlpha = 1;

    // === リングパス ===
    onFill(.02 + Math.sin(G.tick * .06) * .008);
    circle(BOS_CX, BOS_CY, BOS_R + 8); $.globalAlpha = 1;
    onStroke(.1); circleS(BOS_CX, BOS_CY, BOS_R);
    for (let r = 0; r < 12; r++) {
      const ra = -Math.PI / 2 + r * Math.PI / 6 + G.tick * .005;
      const rx = BOS_CX + Math.cos(ra) * (BOS_R + 1), ry = BOS_CY + Math.sin(ra) * (BOS_R + 1);
      $.globalAlpha = .06 + Math.sin(G.tick * .1 + r) * .03; $.fillRect(rx - 1, ry - 1, 2, 2);
    }

    // === セーフゾーンからリングへのパス ===
    onStroke(.05); $.setLineDash([2, 6]);
    $.beginPath(); $.moveTo(SAFE_X - 6, SAFE_Y - 14);
    $.quadraticCurveTo(PED_POS[4].x + 20, SAFE_Y - 40, PED_POS[4].x, PED_POS[4].y + 10); $.stroke();
    $.beginPath(); $.moveTo(SAFE_X + 6, SAFE_Y - 14);
    $.quadraticCurveTo(PED_POS[2].x - 20, SAFE_Y - 40, PED_POS[2].x, PED_POS[2].y + 10); $.stroke();
    $.beginPath(); $.moveTo(SAFE_X, SAFE_Y - 14);
    $.lineTo(PED_POS[3].x, PED_POS[3].y + 8); $.stroke();
    $.setLineDash([]); $.globalAlpha = 1;

    // リング上の位置マーカー
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i]; const isCur = B.pos === i + 1;
      onFill(isCur ? .35 : .08); circle(pp.x, pp.y, isCur ? 4 : 2);
      if (isCur) { $.globalAlpha = .06; circle(pp.x, pp.y, 12); }
    }
    const isSafe = B.pos === 0;
    onFill(isSafe ? .35 : .12); circle(SAFE_X, SAFE_Y, isSafe ? 4 : 2.5);
    if (isSafe) { $.globalAlpha = .06; circle(SAFE_X, SAFE_Y, 14); }
    $.globalAlpha = 1;

    // === 移動プレビュー ===
    if (!B.won) {
      const posR = (B.pos + 1) % 7, posL = (B.pos + 6) % 7;
      const prR = playerXY(posR), prL = playerXY(posL);
      const pls = .1 + Math.sin(G.tick * .12) * .05;
      const curP = playerXY(B.pos);

      if (B.pos === 0) {
        onStroke(pls * 2); $.lineWidth = 2;
        $.setLineDash([4, 4]); $.lineDashOffset = -G.tick * .6;
        $.beginPath(); $.moveTo(SAFE_X + 6, SAFE_Y - 16);
        $.quadraticCurveTo(SAFE_X + 30, SAFE_Y - 60, prR.x, prR.y + 12); $.stroke();
        $.lineDashOffset = G.tick * .6;
        $.beginPath(); $.moveTo(SAFE_X - 6, SAFE_Y - 16);
        $.quadraticCurveTo(SAFE_X - 30, SAFE_Y - 60, prL.x, prL.y + 12); $.stroke();
        $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        $.globalAlpha = pls * 1.2; px(K_F, prR.x - 10, prR.y - 12, 2, true); $.globalAlpha = 1;
        $.globalAlpha = pls * 1.2; px(K_F, prL.x - 10, prL.y - 12, 2, true); $.globalAlpha = 1;
        onFill(pls * 2.5); txt('→', prR.x + 12, prR.y - 4, 7); $.globalAlpha = 1;
        onFill(pls * 2.5); txt('←', prL.x - 24, prL.y - 4, 7); $.globalAlpha = 1;
      } else {
        const curAng = PED_ANG[B.pos - 1];
        if (posR !== 0) {
          const destAng = PED_ANG[posR - 1];
          let endAng = destAng; if (endAng <= curAng) endAng += TAU;
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = -G.tick * .6;
          $.beginPath(); $.arc(BOS_CX, BOS_CY, BOS_R, curAng, endAng); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        } else {
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = -G.tick * .6;
          $.beginPath(); $.moveTo(curP.x, curP.y);
          $.quadraticCurveTo(curP.x + 20, SAFE_Y - 50, SAFE_X, SAFE_Y - 12); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        }
        if (posL !== 0) {
          const destAng = PED_ANG[posL - 1];
          let startAng = destAng; if (startAng >= curAng) startAng -= TAU;
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = G.tick * .6;
          $.beginPath(); $.arc(BOS_CX, BOS_CY, BOS_R, startAng, curAng); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        } else {
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = G.tick * .6;
          $.beginPath(); $.moveTo(curP.x, curP.y);
          $.quadraticCurveTo(curP.x - 20, SAFE_Y - 50, SAFE_X, SAFE_Y - 12); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        }
        $.globalAlpha = pls; px(K_F, prR.x - 10, prR.y - 12, 2, true); $.globalAlpha = 1;
        onFill(pls * 2); txt('→', prR.x + 12, prR.y - 4, 6); $.globalAlpha = 1;
        $.globalAlpha = pls; px(K_F, prL.x - 10, prL.y - 12, 2, true); $.globalAlpha = 1;
        onFill(pls * 2); txt('←', prL.x - 22, prL.y - 4, 6); $.globalAlpha = 1;
      }
    }

    // === デンジャーゾーン ===
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i]; const stg = B.armStage[i];
      if (stg >= 3) {
        const danger = (stg - 2) / 4;
        onFill(danger * .07); circle(pp.x, pp.y, 16 + danger * 6); $.globalAlpha = 1;
      }
    }

    // === 6本の腕 ===
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i];
      const stg = B.armStage[i]; const ext = stg / 6;
      const dx = pp.x - BOS_CX, dy = pp.y - BOS_CY;

      // リーチガイド
      onStroke(.07); $.setLineDash([2, 5]);
      $.beginPath(); $.moveTo(BOS_CX, BOS_CY); $.lineTo(pp.x, pp.y); $.stroke();
      $.setLineDash([]); $.globalAlpha = 1;
      // ステージドット
      for (let s = 1; s <= 6; s++) {
        const sx = BOS_CX + dx * s / 6, sy = BOS_CY + dy * s / 6;
        onFill(s <= stg ? .18 : .05);
        $.fillRect(sx - 1, sy - 1, s <= stg ? 3 : 2, s <= stg ? 3 : 2);
      } $.globalAlpha = 1;

      // 警告パルス
      if (B.armWarn[i] > 0 && stg === 0) {
        const wp = Math.sin(B.armWarn[i] * .5) * .5 + .5;
        onFill(wp * .08); circle(pp.x, pp.y, 22);
        $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = wp * .3;
        circleS(pp.x, pp.y, 18); $.lineWidth = 1;
        if (Math.floor(B.armWarn[i] / 5) % 2) { $.globalAlpha = wp * .55; txt('!', pp.x + 14, pp.y - 14, 8); }
        $.globalAlpha = 1;
      }

      // 腕の本体
      if (stg > 0) {
        const ang = PED_ANG[i]; const perp = { x: -Math.sin(ang), y: Math.cos(ang) };
        const endX = BOS_CX + dx * ext, endY = BOS_CY + dy * ext;
        onStroke(.04); $.lineWidth = 6;
        $.beginPath(); $.moveTo(BOS_CX + 2, BOS_CY + 2);
        for (let t = 0; t <= 1; t += .08) {
          const px2 = BOS_CX + dx * ext * t, py2 = BOS_CY + dy * ext * t;
          const wave = Math.sin(t * 5 + G.tick * .07 + i) * 3 * ext;
          $.lineTo(px2 + perp.x * wave + 2, py2 + perp.y * wave + 2);
        } $.stroke();
        $.globalAlpha = .4 + ext * .6; $.lineWidth = 4 + ext;
        $.beginPath(); $.moveTo(BOS_CX, BOS_CY);
        for (let t = 0; t <= 1; t += .06) {
          const px2 = BOS_CX + dx * ext * t, py2 = BOS_CY + dy * ext * t;
          const wave = Math.sin(t * 5 + G.tick * .07 + i) * 3.5 * ext;
          $.lineTo(px2 + perp.x * wave, py2 + perp.y * wave);
        } $.stroke(); $.lineWidth = 1;
        for (let s = 1; s <= stg; s++) {
          const jt = s / 6; const jx = BOS_CX + dx * jt, jy = BOS_CY + dy * jt;
          const jwave = Math.sin(jt * 5 + G.tick * .07 + i) * 3.5 * ext;
          $.fillStyle = ON; circle(jx + perp.x * jwave, jy + perp.y * jwave, 3);
          $.fillStyle = 'rgba(176,188,152,1)'; circle(jx + perp.x * jwave, jy + perp.y * jwave, 1.5);
        }
        const tipWave = Math.sin(1 * 5 + G.tick * .07 + i) * 3.5 * ext;
        const tipX = endX + perp.x * tipWave, tipY = endY + perp.y * tipWave;
        $.fillStyle = ON; circle(tipX, tipY, 5 + ext * 2);
        $.lineWidth = 2; $.strokeStyle = ON;
        const cl = 7 + ext * 4;
        $.beginPath(); $.moveTo(tipX, tipY); $.lineTo(tipX + Math.cos(ang - .4) * cl, tipY + Math.sin(ang - .4) * cl); $.stroke();
        $.beginPath(); $.moveTo(tipX, tipY); $.lineTo(tipX + Math.cos(ang + .4) * cl, tipY + Math.sin(ang + .4) * cl); $.stroke();
        $.beginPath(); $.moveTo(tipX, tipY); $.lineTo(tipX + Math.cos(ang) * cl, tipY + Math.sin(ang) * cl); $.stroke();
        $.lineWidth = 1;
        if (stg >= 6) { onFill(.1 + Math.sin(G.tick * .3) * .05); circle(pp.x, pp.y, 20); $.globalAlpha = 1; }
        if (stg === 5 && B.armDir[i] === 1) {
          $.strokeStyle = ON; $.lineWidth = 2;
          $.globalAlpha = .2 + Math.sin(G.tick * .4) * .1;
          circleS(pp.x, pp.y, 16); $.lineWidth = 1; $.globalAlpha = 1;
        }
        $.globalAlpha = 1;
      }
    }

    // 腕のスチールトレイル
    G.bosArmTrail = G.bosArmTrail.filter(t => {
      t.life--; if (t.life <= 0) return false;
      const pp = PED_POS[t.idx];
      $.strokeStyle = ON; $.lineWidth = 3; $.globalAlpha = t.life / 8 * .2;
      $.beginPath(); $.moveTo(BOS_CX, BOS_CY); $.lineTo(pp.x, pp.y); $.stroke();
      $.lineWidth = 1; $.globalAlpha = 1; return true;
    });
  };
}
