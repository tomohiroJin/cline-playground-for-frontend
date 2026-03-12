/**
 * ボスシーンレンダラー
 * ボス顔、台座、セーフゾーン、プレイヤー、HUD、勝利演出の描画を担当。
 */

import {
  W, H, BG, GH, ON,
  BOS_CX, BOS_CY, SAFE_X, SAFE_Y, PED_POS,
  K_RW, K_F,
} from '../../constants';
import { TAU } from '../../core/math';
import { Difficulty } from '../../difficulty';
import type { EngineContext } from '../../types';
import { playerXY } from './boss-helpers';

/**
 * ボスシーンレンダラーファクトリ
 * @returns drawBossScene 関数
 */
export function createBossSceneRenderer(ctx: EngineContext) {
  const { G, draw, particles, hud } = ctx;
  const { $, circle, circleS, onFill, onStroke, txt, txtC, px, iGem, iBoss } = draw;
  const { Particles, Popups } = particles;
  const { twoBeatDuration } = hud;

  return function drawBossScene() {
    const B = G.bos;

    // === ボスの顔 ===
    const breathOff = Math.sin(B.bossBreath) * 1.5;
    const angerSh = B.bossAnger >= 4 ? Math.sin(G.tick * .35) * B.bossAnger * .25 : 0;
    const bfx = BOS_CX + angerSh, bfy = BOS_CY + breathOff;
    const pp2 = playerXY(B.pos); const edx = pp2.x - bfx, edy = pp2.y - bfy;
    const ed = Math.sqrt(edx * edx + edy * edy) || 1; const enx = edx / ed * 2.5, eny = edy / ed * 2;
    iBoss(bfx, bfy, true);
    $.fillStyle = ON;
    $.fillRect(bfx - 9 + enx, bfy - 6 + eny, 2, 2);
    $.fillRect(bfx - 2 + enx, bfy - 6 + eny, 2, 2);
    $.fillRect(bfx + 5 + enx, bfy - 6 + eny, 2, 2);
    if (B.bossPulse > 0) {
      $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = B.bossPulse / 5 * .25;
      circleS(bfx, bfy, 28 + (5 - B.bossPulse) * 4);
      $.lineWidth = 1; $.globalAlpha = 1;
    }
    if (B.bossAnger >= 3) {
      const nRings = Math.min(3, B.bossAnger - 2);
      for (let r = 0; r < nRings; r++) {
        onStroke(.04 + Math.sin(G.tick * .1 + r * .7) * .02);
        const ar = 30 + B.bossAnger * 2 + r * 8 + Math.sin(G.tick * .08 + r) * 2;
        circleS(bfx, bfy, ar);
      } $.globalAlpha = 1;
    }
    const nrHot = B.armStage.filter((s: number) => s >= 4).length;
    if (nrHot > 0) {
      onFill(.03 * nrHot + Math.sin(G.tick * .2) * .01);
      circle(bfx, bfy, 26 + nrHot * 2); $.globalAlpha = 1;
    }
    if (B.bossAnger >= 4 && G.tick % Math.max(8, 20 - B.bossAnger * 2) < 2) {
      onStroke(.08); circleS(bfx, bfy, 28); $.globalAlpha = 1;
    }

    // === 台座と宝石 ===
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i];
      onFill(.18); $.fillRect(pp.x - 8, pp.y + 8, 16, 6);
      $.globalAlpha = .1; $.fillRect(pp.x - 6, pp.y + 5, 12, 4); $.globalAlpha = 1;
      $.globalAlpha = .15; txt(String(i + 1), pp.x - 3, pp.y + 16, 5); $.globalAlpha = 1;

      if (B.peds[i] === 1 || B.peds[i] === 2) {
        const beamAlpha = .04 + Math.sin(G.tick * .08 + i * 1.2) * .02;
        $.fillStyle = `rgba(160,200,120,${beamAlpha})`;
        $.fillRect(pp.x - 2, 0, 4, pp.y);
      }
      if (B.peds[i] >= 1) {
        let gy = pp.y - 12;
        if (B.placeAnim[0] === i && B.placeAnim[1] > 0) gy -= B.placeAnim[1] * 2;
        iGem(pp.x - 8, gy, true);
        onFill(.05 + Math.sin(G.tick * .1 + i) * .02);
        circle(pp.x, gy + 9, 10); $.globalAlpha = 1;
        if (G.tick % 14 < 2) {
          onFill(.3); $.fillRect(pp.x - 3 + Math.sin(G.tick * .4 + i) * 5, gy - 2, 2, 2); $.globalAlpha = 1;
        }
      } else { iGem(pp.x - 8, pp.y - 12, false); }

      if (B.peds[i] === 2) {
        $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = .4 + Math.sin(G.tick * .1 + i) * .08;
        $.beginPath(); $.arc(pp.x, pp.y - 4, 14, Math.PI, 0); $.stroke();
        $.globalAlpha = .05; $.beginPath(); $.arc(pp.x, pp.y - 4, 14, Math.PI, 0); $.fill();
        $.globalAlpha = 1; $.lineWidth = 1;
      }
      const stg = B.armStage[i];
      if (stg > 0 || B.armWarn[i] > 0) {
        const arcEnd = -Math.PI / 2 + TAU * (stg / 6);
        $.strokeStyle = ON; $.lineWidth = 2;
        $.globalAlpha = stg >= 5 ? .35 : stg >= 3 ? .2 : .1;
        $.beginPath(); $.arc(pp.x, pp.y, 14, -Math.PI / 2, arcEnd); $.stroke();
        $.lineWidth = 1; $.globalAlpha = 1;
        if (B.armWarn[i] > 0 && Math.floor(B.armWarn[i] / 4) % 2) {
          $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = .2;
          circleS(pp.x, pp.y, 14); $.lineWidth = 1; $.globalAlpha = 1;
        }
      }
      if (B.stealAnim[0] === i && B.stealAnim[1] > 0) {
        $.globalAlpha = B.stealAnim[1] / 10; txtC('LOST!', pp.x, pp.y - 26, 7);
        onFill(B.stealAnim[1] / 10 * .12); circle(pp.x, pp.y, 18); $.globalAlpha = 1;
      }
    }

    // シールドブレイクエフェクト
    G.bosShieldBreak = G.bosShieldBreak.filter(sb => {
      sb.life--; if (sb.life <= 0) return false;
      const pp = PED_POS[sb.idx]; const r = 12 + (10 - sb.life) * 2.5;
      $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = sb.life / 10 * .3;
      circleS(pp.x, pp.y, r);
      for (let f = 0; f < 3; f++) {
        const a = f * TAU / 3 + (10 - sb.life) * .15;
        $.fillStyle = ON; $.fillRect(pp.x + Math.cos(a) * r - 1, pp.y + Math.sin(a) * r - 1, 3, 2);
      }
      $.globalAlpha = 1; $.lineWidth = 1; return true;
    });

    // === セーフゾーン ===
    const safeGlow = B.pos === 0 ? .08 : .04;
    onFill(safeGlow + Math.sin(G.tick * .08) * .01); $.fillRect(SAFE_X - 22, SAFE_Y - 24, 44, 52); $.globalAlpha = 1;
    onStroke(.18); $.strokeRect(SAFE_X - 22, SAFE_Y - 24, 44, 52); $.globalAlpha = 1;
    onFill(.12);
    $.fillRect(SAFE_X - 22, SAFE_Y - 24, 4, 4); $.fillRect(SAFE_X + 18, SAFE_Y - 24, 4, 4);
    $.fillRect(SAFE_X - 22, SAFE_Y + 24, 4, 4); $.fillRect(SAFE_X + 18, SAFE_Y + 24, 4, 4); $.globalAlpha = 1;
    $.globalAlpha = B.pos === 0 ? .4 : .25; txt('SAFE', SAFE_X - 12, SAFE_Y - 20, 5); $.globalAlpha = 1;
    onFill(.35); $.fillRect(SAFE_X - 9, SAFE_Y + 8, 18, 11);
    $.globalAlpha = .2; $.fillRect(SAFE_X - 7, SAFE_Y + 6, 14, 3);
    $.fillRect(SAFE_X - 10, SAFE_Y + 18, 20, 2);
    $.fillStyle = BG; $.globalAlpha = .3; $.fillRect(SAFE_X - 1, SAFE_Y + 12, 3, 3); $.globalAlpha = 1;
    if (!B.hasGem && B.pos !== 0) {
      $.globalAlpha = .55; iGem(SAFE_X - 8, SAFE_Y - 10, true); $.globalAlpha = 1;
      onFill(.04 + Math.sin(G.tick * .1) * .02); circle(SAFE_X, SAFE_Y - 2, 16); $.globalAlpha = 1;
      if (G.tick % 18 < 2) {
        onFill(.2); $.fillRect(SAFE_X - 4 + Math.random() * 8, SAFE_Y - 12 + Math.random() * 6, 2, 2); $.globalAlpha = 1;
      }
    }

    // === アクティブプレイヤー ===
    const destP = playerXY(B.pos);
    let plx = destP.x, ply = destP.y;
    if (B.walkT > 0) {
      const t = B.walkT / 6;
      const fromP = playerXY(B.prevPos);
      plx = fromP.x + (destP.x - fromP.x) * (1 - t);
      ply = fromP.y + (destP.y - fromP.y) * (1 - t);
    }
    if (!(B.hurtCD > 0 && Math.floor(G.tick / 3) % 2)) {
      const br = Math.sin(B.bossBreath) * .4;
      if (B.walkT > 0 && Math.floor(B.walkT / 2) % 2) px(K_RW, plx - 10, ply - 12 + br, 2, true);
      else px(K_F, plx - 10, ply - 12 + br, 2, true);
      if (B.hasGem) {
        iGem(plx - 8, ply - 28, true);
        if (G.tick % 8 < 2) {
          onFill(.25); $.fillRect(plx - 3 + Math.random() * 6, ply - 30 + Math.random() * 5, 2, 2); $.globalAlpha = 1;
        }
      }
    }
    onStroke(.15 + Math.sin(G.tick * .1) * .05); circleS(plx, ply + 2, 18); $.globalAlpha = 1;
    if (B.walkT === 4) {
      onFill(.12); $.fillRect(plx - 5, ply + 16, 3, 2); $.fillRect(plx + 2, ply + 16, 3, 2); $.globalAlpha = 1;
    }

    // === HUD ===
    const placed = B.peds.filter((p: number) => p > 0).length;
    txt('GEM', 14, 34, 5);
    for (let i = 0; i < 6; i++) {
      const gx = 48 + i * 18, gy = 30;
      if (i < placed) {
        $.fillStyle = ON; $.beginPath(); $.moveTo(gx + 5, gy); $.lineTo(gx + 10, gy + 5);
        $.lineTo(gx + 5, gy + 10); $.lineTo(gx, gy + 5); $.fill();
      } else {
        onStroke(.18); $.beginPath();
        $.moveTo(gx + 5, gy); $.lineTo(gx + 10, gy + 5); $.lineTo(gx + 5, gy + 10); $.lineTo(gx, gy + 5); $.closePath(); $.stroke(); $.globalAlpha = 1;
      }
      if (i === placed - 1 && B.placeAnim[1] > 0) {
        onFill(B.placeAnim[1] / 8 * .3); circle(gx + 5, gy + 5, 8); $.globalAlpha = 1;
      }
    }
    txt('SHLD', 286, 34, 5);
    for (let i = 0; i < B.shields; i++) {
      onStroke(.5); circleS(330 + i * 14, 38, 5);
      onFill(.08); circle(330 + i * 14, 38, 5); $.globalAlpha = 1;
    }
    const activeN = B.armStage.filter((s: number) => s > 0).length;
    if (activeN > 0) { $.globalAlpha = .3; txt('ARMS:' + activeN, 175, 34, 5); $.globalAlpha = 1; }

    // アクションヒント
    if (B.pos >= 1 && B.pos <= 6) {
      const pi = B.pos - 1; const pp = PED_POS[pi];
      if (B.hasGem && B.peds[pi] === 0) {
        $.globalAlpha = .45 + Math.sin(G.tick * .12) * .12;
        txt('Z:SET', pp.x - 14, pp.y + 24, 5); $.globalAlpha = 1;
      } else if (B.peds[pi] === 1 && B.shields > 0) {
        $.globalAlpha = .45 + Math.sin(G.tick * .12) * .12;
        txt('↑:SHLD', pp.x - 16, pp.y + 24, 5); $.globalAlpha = 1;
      }
      if (B.armStage[pi] >= 3 && !B.armResting[pi] && B.counterCD <= 0) {
        $.globalAlpha = .5 + Math.sin(G.tick * .25) * .2;
        txt('↓:CTR', pp.x - 14, pp.y + 34, 5); $.globalAlpha = 1;
      }
    }
    if (B.pos === 0) {
      if (B.hasGem) { $.globalAlpha = .35; txt('← →', SAFE_X - 10, SAFE_Y - 32, 5); $.globalAlpha = 1; }
      else { $.globalAlpha = .25 + Math.sin(G.tick * .1) * .08; txt('GEM!', SAFE_X - 10, SAFE_Y - 32, 5); $.globalAlpha = 1; }
    }

    // カウンターフラッシュ
    if (B.counterFlash[1] > 0 && B.counterFlash[0] >= 0) {
      const cfp = PED_POS[B.counterFlash[0]]; const cfa = B.counterFlash[1] / 8;
      $.strokeStyle = ON; $.lineWidth = 3; $.globalAlpha = cfa * .4;
      circleS(cfp.x, cfp.y, 8 + (8 - B.counterFlash[1]) * 4);
      for (let r = 0; r < 6; r++) {
        const a = r * Math.PI / 3 + G.tick * .1; const rl = 10 + (8 - B.counterFlash[1]) * 3;
        $.beginPath(); $.moveTo(cfp.x + Math.cos(a) * 6, cfp.y + Math.sin(a) * 6);
        $.lineTo(cfp.x + Math.cos(a) * rl, cfp.y + Math.sin(a) * rl); $.stroke();
      }
      $.lineWidth = 1; $.globalAlpha = 1;
    }
    if (B.counterCD > 0) {
      const maxCD = twoBeatDuration(); const cdPct = B.counterCD / maxCD;
      const pxy = playerXY(B.pos);
      $.fillStyle = GH; $.fillRect(pxy.x - 12, pxy.y + 20, 24, 3);
      $.fillStyle = ON; $.fillRect(pxy.x - 12, pxy.y + 20, Math.floor(24 * (1 - cdPct)), 3);
    }

    // レイジウェーブフラッシュ
    if (B.rageWave > 0 || B.quake > 0) {
      const ra = Math.max(B.rageWave, B.quake) / 6;
      onFill(ra * .06); $.fillRect(0, 0, W, H); $.globalAlpha = 1;
    }
    if (B.rageWave > 0 && B.rageWave < 8) {
      const rfa = (8 - B.rageWave) / 8;
      $.fillStyle = `rgba(40,10,0,${rfa * .15})`; $.fillRect(0, 0, W, H); $.globalAlpha = 1;
    }

    Particles.updateAndDraw(G.bosParticles);
    Popups.updateAndDraw();

    // === 勝利演出 ===
    if (B.won) {
      const wt = B.wonT;
      if (wt < 4) { $.fillStyle = BG; $.globalAlpha = (4 - wt) / 4 * .4; $.fillRect(0, 0, W, H); $.globalAlpha = 1; }
      if (wt < 40) {
        const sh = (40 - wt) * .6 * Math.sin(G.tick * 1.2);
        iBoss(BOS_CX + sh, BOS_CY, true);
        for (let i = 0; i < 6; i++) {
          const pp = PED_POS[i]; const ext = Math.max(0, 1 - wt / 25);
          if (ext > .05) {
            $.strokeStyle = ON; $.lineWidth = 3; $.globalAlpha = ext * .35;
            $.beginPath(); $.moveTo(BOS_CX, BOS_CY);
            $.lineTo(BOS_CX + (pp.x - BOS_CX) * ext, BOS_CY + (pp.y - BOS_CY) * ext); $.stroke();
            $.globalAlpha = 1; $.lineWidth = 1;
          }
        }
        if (wt > 15 && wt % 2 === 0) {
          onFill(.3);
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * TAU, r = Math.random() * 30 + 10;
            $.fillRect(BOS_CX + Math.cos(a) * r - 1, BOS_CY + Math.sin(a) * r - 1, 3, 3);
          }
          $.globalAlpha = 1;
        }
      }
      if (wt < 70) {
        for (let i = 0; i < 6; i++) {
          const pp = PED_POS[i];
          onFill(Math.max(0, .22 * Math.sin(G.tick * .25 + i) - .012 * (wt - 20)));
          circle(pp.x, pp.y, 8 + Math.sin(G.tick * .25 + i) * 3);
        } $.globalAlpha = 1;
      }
      const oa = Math.min(.92, Math.max(0, (wt - 15) / 25 * .92));
      $.fillStyle = `rgba(176,188,152,${oa})`; $.fillRect(0, 0, W, H);
      if (wt > 35) {
        $.globalAlpha = Math.min(1, (wt - 35) / 18); txtC('DEFEATED!', W / 2, 56, 18);
        $.globalAlpha *= .06; txtC('DEFEATED!', W / 2 + 1, 57, 18); $.globalAlpha = 1;
      }
      if (wt > 55) {
        $.globalAlpha = Math.min(1, (wt - 55) / 14);
        const lw = Math.min(130, (wt - 55) * 2.5); $.fillStyle = ON; $.globalAlpha *= .3;
        $.fillRect(W / 2 - lw / 2, 78, lw, 1); $.fillRect(W / 2 - lw / 2 - 2, 77, 2, 3); $.fillRect(W / 2 + lw / 2, 77, 2, 3);
        $.globalAlpha = Math.min(1, (wt - 55) / 14);
        txtC('— CASTLE —', W / 2, 90, 8); $.globalAlpha = 1;
      }
      if (wt > 70) {
        for (let i = 0; i < 6; i++) {
          const delay = i * 4; const ga = Math.min(1, Math.max(0, (wt - 70 - delay) / 10));
          $.globalAlpha = ga; const bounce = ga < 1 ? 12 * (1 - ga) : Math.sin(G.tick * .12 + i) * .5;
          iGem(W / 2 - 55 + i * 20, 124 - bounce, true);
          if (ga >= 1 && G.tick % (10 + i * 2) < 2) {
            $.globalAlpha = .25;
            $.fillRect(W / 2 - 50 + i * 20 + Math.random() * 8, 120 + Math.random() * 8, 2, 2);
          }
        } $.globalAlpha = 1;
      }
      if (wt > 90) {
        $.globalAlpha = Math.min(1, (wt - 90) / 14);
        txtC('BONUS +' + 5000 * G.loop, W / 2, 168, 8); $.globalAlpha = 1;
      }
      if (wt > 105 && G.noDmg) {
        $.globalAlpha = Math.min(1, (wt - 105) / 12);
        txtC('NO DAMAGE +' + 10000 * G.loop + '!', W / 2, 188, 7); $.globalAlpha = 1;
      }
      if (wt > 115) {
        $.globalAlpha = Math.min(1, (wt - 115) / 22);
        if (Difficulty.isTrueEnding(G.loop)) txtC('...The final seal shatters...', W / 2, 228, 7);
        else if (G.loop === 1) txtC('...But this is not the end...', W / 2, 228, 7);
        else txtC('...The curse grows stronger...', W / 2, 228, 7);
        $.globalAlpha = 1;
      }
      if (wt > 130 && G.loop < 3) {
        $.globalAlpha = Math.min(1, (wt - 130) / 18);
        txtC('LOOP ' + (G.loop + 1) + ' APPROACHES', W / 2, 260, 6); $.globalAlpha = 1;
      }
      if (wt > 20) {
        $.fillStyle = ON;
        for (let sp = 0; sp < 2; sp++) {
          const sx = 40 + (G.tick * 17 + sp * 127) % 360, sy = 50 + (G.tick * 11 + sp * 89 + wt * 5) % 200;
          $.globalAlpha = .15 + Math.sin(G.tick * .12 + sp) * .08; $.fillRect(sx, sy, 2, 2);
        } $.globalAlpha = 1;
      }
    }
  };
}
