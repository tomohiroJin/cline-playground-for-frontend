/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — ボスステージモジュール
 * engine.ts から抽出した STAGE 3: CASTLE（ボス戦）のロジック。
 * 6本の腕を持つ円形ボス、宝石設置、カウンター攻撃、レイジウェーブ。
 */

import {
  W, H, BG, GH, ON, RK,
  BOS_CX, BOS_CY, BOS_R, SAFE_X, SAFE_Y, PED_ANG, PED_POS,
  K_R, K_RW, K_F, K_HU, KEY_D,
  TICK_RATE,
  assert
} from '../../constants';

import { TAU, rng, rngInt, rngSpread, shuffle } from '../../core/math';

import { Difficulty } from '../../difficulty';

/**
 * ボスステージファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createBossStage(ctx) {
  const { G, draw, audio, particles, hud } = ctx;

  // 描画ヘルパーの分割代入
  const { $, circle, circleS, onFill, onStroke, R, txt, txtC, px, drawK,
          lcdFg, lcdBg, iHeart, iGem, iSlime, iGoblin, iSkel, iBoss, iArmDown, iArmUp } = draw;

  // オーディオの分割代入
  const { S, ea } = audio;

  // パーティクルの分割代入
  const { Particles, Popups } = particles;

  // HUDの分割代入
  const { BL, twoBeatDuration, doHurt, transTo } = hud;

  // --- 入力ヘルパー ---
  function J(k) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  /** ポップアップ追加のショートカット */
  function addPopup(x, y, t) { Popups.add(x, y, t); }

  // --- プレイヤー座標ヘルパー ---
  function playerXY(pos) {
    if (pos === 0) return { x: SAFE_X, y: SAFE_Y };
    return { x: PED_POS[pos - 1].x, y: PED_POS[pos - 1].y };
  }

  // === ボス初期化 ===
  function bosInit() {
    assert(G.loop >= 1, 'bosInit: loop must be >= 1');
    G.state = 'boss'; G.beatCtr = 0; G.beatNum = 0; Popups.clear();
    G.bosParticles = []; G.bosShieldBreak = []; G.bosArmTrail = [];
    // アームスピード — Difficultyモジュールから
    const baseSpd = Difficulty.bossArmSpeed(G.loop);
    const spdVar = G.loop <= 2 ? 1 : 0;
    const baseRest = Difficulty.bossArmRest(G.loop);
    const restVar = G.loop <= 2 ? 2 : 1;
    const initDelays = shuffle([0, 3, 6, 9, 12, 15].map(d => d + rngInt(0, 2)));
    const spd = [], rest = [];
    for (let i = 0; i < 6; i++) {
      spd.push(Math.max(1, baseSpd + rngInt(-spdVar, spdVar)));
      rest.push(Math.max(1, baseRest + rngInt(-restVar, restVar)));
    }
    // シールド — Difficultyモジュールから
    const totalShields = Difficulty.bossShields(G.earnedShields);
    G.bos = {
      pos: 0, hasGem: false,
      peds: [0, 0, 0, 0, 0, 0],
      armStage: [0, 0, 0, 0, 0, 0], armDir: [1, 1, 1, 1, 1, 1],
      armSpeed: spd, armBaseSpd: baseSpd, armSpdVar: spdVar,
      armRest: rest, armBaseRest: baseRest, armRestVar: restVar,
      armBeat: [0, 0, 0, 0, 0, 0],
      armResting: [true, true, true, true, true, true],
      armRestT: [...initDelays],
      armWarn: [0, 0, 0, 0, 0, 0],
      shields: totalShields,
      hurtCD: 0, moveCD: 0, won: false, wonT: 0, walkT: 0, prevPos: 0,
      stealAnim: [-1, 0], placeAnim: [-1, 0], shieldAnim: [-1, 0],
      bossAnger: 0, bossPulse: 0, bossBreath: 0,
      counterCD: 0, counterFlash: [-1, 0],
      rageWave: 0,
      quake: 0
    };
  }

  // === ボスダメージチェック ===
  function bosChk() {
    const B = G.bos;
    if (B.pos >= 1 && B.pos <= 6) {
      const ai = B.pos - 1;
      if (B.armStage[ai] >= 6 && B.hurtCD <= 0) {
        B.hurtCD = twoBeatDuration(); if (B.hasGem) B.hasGem = false; B.pos = 0; doHurt();
      }
    }
  }

  // === ボス更新 ===
  function bosUpdate(nb) {
    const B = G.bos;
    if (B.hurtCD > 0) B.hurtCD--;
    if (B.moveCD > 0) B.moveCD--;
    if (B.counterCD > 0) B.counterCD--;
    if (B.stealAnim[1] > 0) B.stealAnim[1]--;
    if (B.placeAnim[1] > 0) B.placeAnim[1]--;
    if (B.shieldAnim[1] > 0) B.shieldAnim[1]--;
    if (B.counterFlash[1] > 0) B.counterFlash[1]--;
    if (B.bossPulse > 0) B.bossPulse--;
    if (B.quake > 0) B.quake--;
    B.bossBreath += .04;
    if (B.walkT > 0) B.walkT--;
    if (B.won) {
      B.wonT++;
      if (B.wonT === 150) {
        if (Difficulty.isTrueEnding(G.loop)) { G.state = 'trueEnd'; G.teT = 0; G.tick = 0; }
        else if (G.loop === 1) { G.state = 'ending1'; G.e1T = 0; G.tick = 0; }
        else { G.loop++; G.noDmg = true; if (G.hp < G.maxHp) G.hp++; transTo('LOOP ' + G.loop, G.cavInit, 'HARDER!'); }
      }
      return;
    }
    B.bossAnger = B.peds.filter(p => p > 0).length;
    for (let i = 0; i < 6; i++) if (B.armWarn[i] > 0) B.armWarn[i]--;

    // 移動 ←→ （0-6の循環）
    if (B.moveCD <= 0) {
      if (J('arrowright')) {
        B.prevPos = B.pos; B.pos = (B.pos + 1) % 7; B.moveCD = 3; B.walkT = 6;
        if (B.pos === 0) S.safe(); else S.move();
        if (B.pos === 0 && !B.hasGem) B.hasGem = true; bosChk();
      } else if (J('arrowleft')) {
        B.prevPos = B.pos; B.pos = (B.pos + 6) % 7; B.moveCD = 3; B.walkT = 6;
        if (B.pos === 0) S.safe(); else S.move();
        if (B.pos === 0 && !B.hasGem) B.hasGem = true; bosChk();
      }
    }
    if (B.pos === 0 && !B.hasGem) B.hasGem = true;

    // Z = 宝石設置 / シールド
    if (jAct() && B.pos >= 1 && B.pos <= 6) {
      const pi = B.pos - 1; const pp = PED_POS[pi];
      if (B.hasGem && B.peds[pi] === 0) {
        B.peds[pi] = 1; B.hasGem = false; B.placeAnim = [pi, 8];
        G.score += 500 * G.loop; addPopup(pp.x, pp.y - 20, '+' + 500 * G.loop);
        S.gem(); ea();
        if (B.peds.every(p => p > 0)) {
          B.won = true; B.wonT = 0; S.clear(); S.bossDie(); G.score += 5000 * G.loop;
          if (G.noDmg) G.score += 10000 * G.loop;
        }
      } else if (B.peds[pi] === 1 && B.shields > 0) {
        B.peds[pi] = 2; B.shields--; B.shieldAnim = [pi, 8];
        G.score += 200 * G.loop; addPopup(pp.x, pp.y - 20, 'SHIELD');
        S.guard(); ea();
      }
    }
    // ↑ = シールドショートカット
    if (J('arrowup') && B.pos >= 1 && B.pos <= 6) {
      const pi = B.pos - 1; const pp = PED_POS[pi];
      if (B.peds[pi] === 1 && B.shields > 0) {
        B.peds[pi] = 2; B.shields--; B.shieldAnim = [pi, 8];
        G.score += 200 * G.loop; addPopup(pp.x, pp.y - 20, 'SHIELD');
        S.guard(); ea();
      }
    }

    // ↓ = カウンターアタック — 接近中の腕を弾く
    if (J('arrowdown') && B.pos >= 1 && B.pos <= 6 && B.counterCD <= 0) {
      const pi = B.pos - 1;
      if (B.armStage[pi] >= 3 && !B.armResting[pi]) {
        // 弾き返し！ 腕をリセットしてスタン
        B.armStage[pi] = 0; B.armResting[pi] = true;
        B.armRestT[pi] = Math.max(2, B.armBaseRest + 2); // 弾き返し後はより長い休息
        B.armDir[pi] = 1; B.counterCD = twoBeatDuration(); // クールダウン = 2ビート
        B.counterFlash = [pi, 8];
        G.score += 300 * G.loop; addPopup(PED_POS[pi].x, PED_POS[pi].y - 20, 'COUNTER!');
        S.kill(); G.hitStop = 3; // S.kill()の後にヒットストップを上書き
        Particles.spawn(G.bosParticles, {
          x: PED_POS[pi].x, y: PED_POS[pi].y - 4,
          n: 8, vxSpread: 1.5, vySpread: 1.2, vyBase: -1.5, life: 12, s: 3, gravity: .1
        });
        B.bossPulse = 5; ea();
      }
    }

    if (!nb) return;
    // --- ビートティック ---
    // レイジウェーブ: 怒りレベル >= 3 の時、複数の腕が同時に攻撃
    if (B.bossAnger >= 3 && B.rageWave <= 0 && rng() < .08 * B.bossAnger) {
      B.rageWave = 1; B.quake = 6;
      // 2-3本の休眠中の腕を同時に起こす
      let woken = 0; const target = B.bossAnger >= 5 ? 3 : 2;
      for (let i = 0; i < 6; i++) {
        if (woken >= target) break;
        if (B.armResting[i] && B.armRestT[i] > 1) {
          B.armRestT[i] = 1; woken++;
        }
      }
      if (woken > 0) { S.warn(); S.zap(); addPopup(BOS_CX, BOS_CY - 40, 'RAGE!'); }
    }
    if (B.rageWave > 0) B.rageWave--;
    for (let i = 0; i < 6; i++) {
      if (B.armResting[i]) {
        B.armRestT[i]--;
        if (B.armRestT[i] === 2) { B.armWarn[i] = Math.round(B.armSpeed[i] * 30 / TICK_RATE * 2 + 12); }
        if (B.armRestT[i] <= 0) {
          B.armResting[i] = false; B.armDir[i] = 1;
          B.armSpeed[i] = Math.max(1, B.armBaseSpd + rngInt(-B.armSpdVar, B.armSpdVar));
        }
        continue;
      }
      B.armBeat[i]++;
      if (B.armBeat[i] >= B.armSpeed[i]) {
        B.armBeat[i] = 0;
        B.armStage[i] += B.armDir[i];
        // 危険接近時の音声キュー
        if (B.armStage[i] === 5 && B.armDir[i] === 1) S.warn();
        if (B.armStage[i] >= 6) {
          B.armStage[i] = 6; B.armDir[i] = -1; B.bossPulse = 5;
          const pp = PED_POS[i];
          if (B.peds[i] === 1) {
            B.peds[i] = 0; B.stealAnim = [i, 10]; S.steal();
            Particles.spawn(G.bosParticles, {
              x: pp.x, y: pp.y - 6, n: 8, vxSpread: 1.2, vySpread: 1.2, vyBase: -1.5, life: 14, s: 3, gravity: .1
            });
            G.bosArmTrail.push({ idx: i, life: 8 });
          }
          if (B.peds[i] === 2) {
            B.peds[i] = 1; B.shieldAnim = [i, 8];
            G.bosShieldBreak.push({ idx: i, life: 10 }); S.shieldBreak();
            Particles.spawn(G.bosParticles, {
              x: pp.x, y: pp.y - 6, n: 6, vxSpread: 1.5, vySpread: 1, vyBase: -1, life: 12, s: 3, gravity: .1
            });
          }
          if (B.pos === i + 1 && B.hurtCD <= 0) {
            B.hurtCD = twoBeatDuration(); if (B.hasGem) B.hasGem = false; B.pos = 0; doHurt();
          }
        }
        if (B.armStage[i] <= 0) {
          B.armStage[i] = 0; B.armResting[i] = true;
          B.armRestT[i] = Math.max(1, B.armBaseRest + rngInt(-B.armRestVar, B.armRestVar));
          if (B.bossAnger >= 3) B.armRestT[i] = Math.max(1, B.armRestT[i] - 1);
          if (B.bossAnger >= 5) B.armRestT[i] = Math.max(1, B.armRestT[i] - 1);
        }
      }
    }
  }

  // === 城背景描画 ===
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
      $.fillRect(wx - 12, wy + 10, 24, 28); // ガラス部分
      $.globalAlpha = .08;
      $.beginPath(); $.moveTo(wx, wy - 4); $.lineTo(wx, wy + 40); $.stroke(); // 縦分割
      $.beginPath(); $.moveTo(wx - 14, wy + 20); $.lineTo(wx + 14, wy + 20); $.stroke(); // 横分割
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
      $.fillRect(tx - 3, 54, 7, 2); // ブラケット
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
    // 高い背もたれ
    onFill(.04);
    $.fillRect(BOS_CX - 18, BOS_CY - 55, 36, 20);
    // 側面の尖塔
    $.fillRect(BOS_CX - 22, BOS_CY - 48, 6, 14); $.fillRect(BOS_CX + 16, BOS_CY - 48, 6, 14);
    // 尖った頂部
    $.beginPath(); $.moveTo(BOS_CX - 22, BOS_CY - 48); $.lineTo(BOS_CX - 19, BOS_CY - 58); $.lineTo(BOS_CX - 16, BOS_CY - 48); $.fill();
    $.beginPath(); $.moveTo(BOS_CX + 16, BOS_CY - 48); $.lineTo(BOS_CX + 19, BOS_CY - 58); $.lineTo(BOS_CX + 22, BOS_CY - 48); $.fill();
    $.globalAlpha = 1;

    // === 床 ===
    // メイン床ライン
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

  // === ボス描画 ===
  function bosDraw() {
    const B = G.bos;
    drawCastleBG();

    // === 環境ダンジョン装飾 ===
    // 浮遊するほこり（ゆっくり、のんびり）
    $.fillStyle = ON;
    for (let i = 0; i < 10; i++) {
      const dx = (G.tick * .15 + i * 47) % W, dy = (G.tick * .08 + i * 33 + Math.sin(G.tick * .02 + i * 1.7) * 20) % H;
      $.globalAlpha = .04 + Math.sin(G.tick * .03 + i * 2) * .02;
      $.fillRect(dx, dy, 1 + ((i % 3 === 0) ? 1 : 0), 1);
    } $.globalAlpha = 1;

    // 壁のドクロ装飾（アリーナの両脇）
    for (const [sx, sy] of [[22, 90], [W - 22, 90], [22, 200], [W - 22, 200]]) {
      onFill(.06);
      circle(sx, sy, 5); // 頭蓋骨
      $.fillRect(sx - 3, sy + 4, 6, 3); // 顎
      $.fillStyle = BG; $.globalAlpha = .04;
      $.fillRect(sx - 2, sy - 1, 2, 2); $.fillRect(sx + 1, sy - 1, 2, 2); // 目窩
      $.globalAlpha = 1;
    }

    // 床の魔法陣（大きい、リングの周り）
    onStroke(.03 + Math.sin(G.tick * .04) * .01);
    circleS(BOS_CX, BOS_CY, BOS_R + 22);
    // 内円
    $.globalAlpha = .025; circleS(BOS_CX, BOS_CY, BOS_R - 10);
    // 六芒星（円に内接）
    for (let i = 0; i < 6; i++) {
      const a1 = -Math.PI / 2 + i * Math.PI / 3, a2 = -Math.PI / 2 + (i + 2) * Math.PI / 3;
      const r2 = BOS_R + 18;
      $.globalAlpha = .02; $.beginPath();
      $.moveTo(BOS_CX + Math.cos(a1) * r2, BOS_CY + Math.sin(a1) * r2);
      $.lineTo(BOS_CX + Math.cos(a2) * r2, BOS_CY + Math.sin(a2) * r2); $.stroke();
    }
    $.globalAlpha = 1;

    // ルーン文字（台座間、外円上）
    for (let i = 0; i < 6; i++) {
      const midA = PED_ANG[i] + Math.PI / 6; // 台座間
      const rx = BOS_CX + Math.cos(midA) * (BOS_R + 18), ry = BOS_CY + Math.sin(midA) * (BOS_R + 18);
      onFill(.04 + Math.sin(G.tick * .06 + i * 1.1) * .015);
      // 小さな十字/ルーン形状
      $.fillRect(rx - 1, ry - 3, 2, 6); $.fillRect(rx - 3, ry - 1, 6, 2);
    }
    $.globalAlpha = 1;

    // 魔法のきらめき（台座付近で上方に漂う）
    for (let i = 0; i < 4; i++) {
      const pi2 = Math.floor((G.tick * .07 + i * 1.5) % 6); const pp = PED_POS[pi2];
      if (B.peds[pi2] > 0) {
        const sparkX = pp.x - 8 + ((G.tick * 1.3 + i * 37) % 16), sparkY = pp.y - 20 - ((G.tick * .5 + i * 19) % 30);
        onFill(.08 + Math.sin(G.tick * .2 + i) * .04);
        $.fillRect(sparkX, sparkY, 1, 1); $.globalAlpha = 1;
      }
    }

    // 床のひび割れ（静的、中心から放射状）
    onStroke(.025);
    for (let i = 0; i < 5; i++) {
      const ca = -Math.PI / 2 + i * TAU / 5 + .5;
      $.beginPath(); $.moveTo(BOS_CX + Math.cos(ca) * 20, BOS_CY + Math.sin(ca) * 20);
      $.lineTo(BOS_CX + Math.cos(ca + .1) * 55, BOS_CY + Math.sin(ca + .1) * 55); $.stroke();
    }
    $.globalAlpha = 1;

    // === リングパス（移動経路の表示） ===
    // アルケインな内側のグロー
    onFill(.02 + Math.sin(G.tick * .06) * .008);
    circle(BOS_CX, BOS_CY, BOS_R + 8); $.globalAlpha = 1;
    // リング円を描画（移動パス）
    onStroke(.1);
    circleS(BOS_CX, BOS_CY, BOS_R);
    // リング上の回転ルーンドット
    for (let r = 0; r < 12; r++) {
      const ra = -Math.PI / 2 + r * Math.PI / 6 + G.tick * .005;
      const rx = BOS_CX + Math.cos(ra) * (BOS_R + 1), ry = BOS_CY + Math.sin(ra) * (BOS_R + 1);
      $.globalAlpha = .06 + Math.sin(G.tick * .1 + r) * .03; $.fillRect(rx - 1, ry - 1, 2, 2);
    }

    // === セーフゾーンからリングへのパス（微細な静的コネクタ） ===
    onStroke(.05);
    $.setLineDash([2, 6]);
    // 左コネクタ: セーフ → pos 6（左上）
    $.beginPath(); $.moveTo(SAFE_X - 6, SAFE_Y - 14);
    $.quadraticCurveTo(PED_POS[4].x + 20, SAFE_Y - 40, PED_POS[4].x, PED_POS[4].y + 10); $.stroke();
    // 右コネクタ: セーフ → pos 1（上部）
    $.beginPath(); $.moveTo(SAFE_X + 6, SAFE_Y - 14);
    $.quadraticCurveTo(PED_POS[2].x - 20, SAFE_Y - 40, PED_POS[2].x, PED_POS[2].y + 10); $.stroke();
    // 中央コネクタ: セーフ → pos 4（下部）
    $.beginPath(); $.moveTo(SAFE_X, SAFE_Y - 14);
    $.lineTo(PED_POS[3].x, PED_POS[3].y + 8); $.stroke();
    $.setLineDash([]); $.globalAlpha = 1;

    // リング上の位置マーカー（現在位置にはグロー付き）
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i];
      const isCur = B.pos === i + 1;
      onFill(isCur ? .35 : .08);
      circle(pp.x, pp.y, isCur ? 4 : 2);
      if (isCur) { $.globalAlpha = .06; circle(pp.x, pp.y, 12); }
    }
    // セーフゾーンマーカー
    const isSafe = B.pos === 0;
    onFill(isSafe ? .35 : .12); circle(SAFE_X, SAFE_Y, isSafe ? 4 : 2.5);
    if (isSafe) { $.globalAlpha = .06; circle(SAFE_X, SAFE_Y, 14); }
    $.globalAlpha = 1;

    // === 移動プレビュー（← と → の行き先を表示） ===
    if (!B.won) {
      const posR = (B.pos + 1) % 7, posL = (B.pos + 6) % 7;
      const prR = playerXY(posR), prL = playerXY(posL);
      const pls = .1 + Math.sin(G.tick * .12) * .05;
      const curP = playerXY(B.pos);

      if (B.pos === 0) {
        // === セーフゾーンにいる時: リングへの入口パスを表示 ===
        // 右入口（→ → pos 1、上部台座）
        onStroke(pls * 2); $.lineWidth = 2;
        $.setLineDash([4, 4]); $.lineDashOffset = -G.tick * .6;
        $.beginPath(); $.moveTo(SAFE_X + 6, SAFE_Y - 16);
        $.quadraticCurveTo(SAFE_X + 30, SAFE_Y - 60, prR.x, prR.y + 12); $.stroke();
        // 左入口（← → pos 6、左上台座）
        $.lineDashOffset = G.tick * .6;
        $.beginPath(); $.moveTo(SAFE_X - 6, SAFE_Y - 16);
        $.quadraticCurveTo(SAFE_X - 30, SAFE_Y - 60, prL.x, prL.y + 12); $.stroke();
        $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;

        // 入口ポイントのゴーストスプライト
        $.globalAlpha = pls * 1.2; px(K_F, prR.x - 10, prR.y - 12, 2, true); $.globalAlpha = 1;
        $.globalAlpha = pls * 1.2; px(K_F, prL.x - 10, prL.y - 12, 2, true); $.globalAlpha = 1;

        // 行き先の矢印ラベル
        onFill(pls * 2.5); txt('→', prR.x + 12, prR.y - 4, 7); $.globalAlpha = 1;
        onFill(pls * 2.5); txt('←', prL.x - 24, prL.y - 4, 7); $.globalAlpha = 1;

      } else {
        // === リング上にいる時: 隣接する台座へのアークパスを表示 ===
        const curAng = PED_ANG[B.pos - 1];

        // 現在位置から右（→、時計回り）への弧を描画
        if (posR !== 0) {
          const destAng = PED_ANG[posR - 1];
          let endAng = destAng; if (endAng <= curAng) endAng += TAU;
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = -G.tick * .6;
          $.beginPath(); $.arc(BOS_CX, BOS_CY, BOS_R, curAng, endAng); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        } else {
          // → がセーフゾーンに続く場合: リングから曲がるパスを描画
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = -G.tick * .6;
          $.beginPath(); $.moveTo(curP.x, curP.y);
          $.quadraticCurveTo(curP.x + 20, SAFE_Y - 50, SAFE_X, SAFE_Y - 12); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        }

        // 現在位置から左（←、反時計回り）への弧を描画
        if (posL !== 0) {
          const destAng = PED_ANG[posL - 1];
          let startAng = destAng; if (startAng >= curAng) startAng -= TAU;
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = G.tick * .6;
          $.beginPath(); $.arc(BOS_CX, BOS_CY, BOS_R, startAng, curAng); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        } else {
          // ← がセーフゾーンに続く場合
          onStroke(pls * 2); $.lineWidth = 2;
          $.setLineDash([4, 4]); $.lineDashOffset = G.tick * .6;
          $.beginPath(); $.moveTo(curP.x, curP.y);
          $.quadraticCurveTo(curP.x - 20, SAFE_Y - 50, SAFE_X, SAFE_Y - 12); $.stroke();
          $.setLineDash([]); $.lineWidth = 1; $.globalAlpha = 1;
        }

        // 行き先のゴーストスプライト + ラベル
        $.globalAlpha = pls; px(K_F, prR.x - 10, prR.y - 12, 2, true); $.globalAlpha = 1;
        onFill(pls * 2); txt('→', prR.x + 12, prR.y - 4, 6); $.globalAlpha = 1;
        $.globalAlpha = pls; px(K_F, prL.x - 10, prL.y - 12, 2, true); $.globalAlpha = 1;
        onFill(pls * 2); txt('←', prL.x - 22, prL.y - 4, 6); $.globalAlpha = 1;
      }
    }

    // === デンジャーゾーン（腕の後ろ） ===
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i]; const stg = B.armStage[i];
      if (stg >= 3) {
        const danger = (stg - 2) / 4;
        onFill(danger * .07);
        circle(pp.x, pp.y, 16 + danger * 6); $.globalAlpha = 1;
      }
    }

    // === 6本の腕（中心から放射状） ===
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i];
      const stg = B.armStage[i]; const ext = stg / 6;
      const dx = pp.x - BOS_CX, dy = pp.y - BOS_CY;

      // リーチガイド（点線パス）
      onStroke(.07);
      $.setLineDash([2, 5]); $.beginPath(); $.moveTo(BOS_CX, BOS_CY); $.lineTo(pp.x, pp.y); $.stroke();
      $.setLineDash([]); $.globalAlpha = 1;
      // パス上のステージドット
      for (let s = 1; s <= 6; s++) {
        const sx = BOS_CX + dx * s / 6, sy = BOS_CY + dy * s / 6;
        onFill(s <= stg ? .18 : .05);
        $.fillRect(sx - 1, sy - 1, s <= stg ? 3 : 2, s <= stg ? 3 : 2);
      } $.globalAlpha = 1;

      // 警告パルス
      if (B.armWarn[i] > 0 && stg === 0) {
        const wp = Math.sin(B.armWarn[i] * .5) * .5 + .5;
        onFill(wp * .08);
        circle(pp.x, pp.y, 22);
        $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = wp * .3;
        circleS(pp.x, pp.y, 18); $.lineWidth = 1;
        if (Math.floor(B.armWarn[i] / 5) % 2) { $.globalAlpha = wp * .55; txt('!', pp.x + 14, pp.y - 14, 8); }
        $.globalAlpha = 1;
      }

      // 腕の本体（波状、有機的）
      if (stg > 0) {
        const ang = PED_ANG[i]; const perp = { x: -Math.sin(ang), y: Math.cos(ang) };
        const endX = BOS_CX + dx * ext, endY = BOS_CY + dy * ext;
        // 影
        onStroke(.04); $.lineWidth = 6;
        $.beginPath(); $.moveTo(BOS_CX + 2, BOS_CY + 2);
        for (let t = 0; t <= 1; t += .08) {
          const px2 = BOS_CX + dx * ext * t, py2 = BOS_CY + dy * ext * t;
          const wave = Math.sin(t * 5 + G.tick * .07 + i) * 3 * ext;
          $.lineTo(px2 + perp.x * wave + 2, py2 + perp.y * wave + 2);
        } $.stroke();
        // メイン腕
        $.globalAlpha = .4 + ext * .6; $.lineWidth = 4 + ext;
        $.beginPath(); $.moveTo(BOS_CX, BOS_CY);
        for (let t = 0; t <= 1; t += .06) {
          const px2 = BOS_CX + dx * ext * t, py2 = BOS_CY + dy * ext * t;
          const wave = Math.sin(t * 5 + G.tick * .07 + i) * 3.5 * ext;
          $.lineTo(px2 + perp.x * wave, py2 + perp.y * wave);
        } $.stroke(); $.lineWidth = 1;
        // 関節（吸盤）
        for (let s = 1; s <= stg; s++) {
          const jt = s / 6; const jx = BOS_CX + dx * jt, jy = BOS_CY + dy * jt;
          const jwave = Math.sin(jt * 5 + G.tick * .07 + i) * 3.5 * ext;
          $.fillStyle = ON; circle(jx + perp.x * jwave, jy + perp.y * jwave, 3);
          $.fillStyle = BG; circle(jx + perp.x * jwave, jy + perp.y * jwave, 1.5);
        }
        // 先端の爪
        const tipWave = Math.sin(1 * 5 + G.tick * .07 + i) * 3.5 * ext;
        const tipX = endX + perp.x * tipWave, tipY = endY + perp.y * tipWave;
        $.fillStyle = ON; circle(tipX, tipY, 5 + ext * 2);
        $.lineWidth = 2; $.strokeStyle = ON;
        const cl = 7 + ext * 4;
        $.beginPath(); $.moveTo(tipX, tipY); $.lineTo(tipX + Math.cos(ang - .4) * cl, tipY + Math.sin(ang - .4) * cl); $.stroke();
        $.beginPath(); $.moveTo(tipX, tipY); $.lineTo(tipX + Math.cos(ang + .4) * cl, tipY + Math.sin(ang + .4) * cl); $.stroke();
        $.beginPath(); $.moveTo(tipX, tipY); $.lineTo(tipX + Math.cos(ang) * cl, tipY + Math.sin(ang) * cl); $.stroke();
        $.lineWidth = 1;
        // 完全伸長時の危険パルス
        if (stg >= 6) {
          onFill(.1 + Math.sin(G.tick * .3) * .05);
          circle(pp.x, pp.y, 20); $.globalAlpha = 1;
        }
        // ステージ5接近中
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

    // === ボスの顔 ===
    const breathOff = Math.sin(B.bossBreath) * 1.5;
    const angerSh = B.bossAnger >= 4 ? Math.sin(G.tick * .35) * B.bossAnger * .25 : 0;
    const bfx = BOS_CX + angerSh, bfy = BOS_CY + breathOff;
    // 目の方向がプレイヤーを追跡
    const pp2 = playerXY(B.pos); const edx = pp2.x - bfx, edy = pp2.y - bfy;
    const ed = Math.sqrt(edx * edx + edy * edy) || 1; const enx = edx / ed * 2.5, eny = edy / ed * 2;
    iBoss(bfx, bfy, true);
    // 目の瞳がプレイヤーを追跡（3つのスロット）
    $.fillStyle = ON;
    $.fillRect(bfx - 9 + enx, bfy - 6 + eny, 2, 2);
    $.fillRect(bfx - 2 + enx, bfy - 6 + eny, 2, 2);
    $.fillRect(bfx + 5 + enx, bfy - 6 + eny, 2, 2);
    // パルスリング
    if (B.bossPulse > 0) {
      $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = B.bossPulse / 5 * .25;
      circleS(bfx, bfy, 28 + (5 - B.bossPulse) * 4);
      $.lineWidth = 1; $.globalAlpha = 1;
    }
    // 怒りオーラ（脈動するリング）
    if (B.bossAnger >= 3) {
      const nRings = Math.min(3, B.bossAnger - 2);
      for (let r = 0; r < nRings; r++) {
        onStroke(.04 + Math.sin(G.tick * .1 + r * .7) * .02);
        const ar = 30 + B.bossAnger * 2 + r * 8 + Math.sin(G.tick * .08 + r) * 2;
        circleS(bfx, bfy, ar);
      } $.globalAlpha = 1;
    }
    // 目のグロー（アクティブな腕で強化）
    const nrHot = B.armStage.filter(s => s >= 4).length;
    if (nrHot > 0) {
      onFill(.03 * nrHot + Math.sin(G.tick * .2) * .01);
      circle(bfx, bfy, 26 + nrHot * 2); $.globalAlpha = 1;
    }
    // 鼓動（怒り時）
    if (B.bossAnger >= 4 && G.tick % Math.max(8, 20 - B.bossAnger * 2) < 2) {
      onStroke(.08);
      circleS(bfx, bfy, 28); $.globalAlpha = 1;
    }

    // === 台座と宝石 ===
    for (let i = 0; i < 6; i++) {
      const pp = PED_POS[i];
      // 台座の基部
      onFill(.18);
      $.fillRect(pp.x - 8, pp.y + 8, 16, 6);
      $.globalAlpha = .1; $.fillRect(pp.x - 6, pp.y + 5, 12, 4); $.globalAlpha = 1;
      // 台座番号
      $.globalAlpha = .15; txt(String(i + 1), pp.x - 3, pp.y + 16, 5); $.globalAlpha = 1;

      // 設置済み宝石の光柱
      if (B.peds[i] === 1 || B.peds[i] === 2) {
        const beamAlpha = .04 + Math.sin(G.tick * .08 + i * 1.2) * .02;
        $.fillStyle = `rgba(160,200,120,${beamAlpha})`;
        const bx = pp.x - 2, bw = 4;
        $.fillRect(bx, 0, bw, pp.y);
      }

      // 宝石
      if (B.peds[i] >= 1) {
        let gy = pp.y - 12;
        if (B.placeAnim[0] === i && B.placeAnim[1] > 0) gy -= B.placeAnim[1] * 2;
        iGem(pp.x - 8, gy, true);
        // 宝石のグロー
        onFill(.05 + Math.sin(G.tick * .1 + i) * .02);
        circle(pp.x, gy + 9, 10); $.globalAlpha = 1;
        // きらめき
        if (G.tick % 14 < 2) {
          onFill(.3);
          $.fillRect(pp.x - 3 + Math.sin(G.tick * .4 + i) * 5, gy - 2, 2, 2); $.globalAlpha = 1;
        }
      } else { iGem(pp.x - 8, pp.y - 12, false); }

      // シールドドーム
      if (B.peds[i] === 2) {
        $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = .4 + Math.sin(G.tick * .1 + i) * .08;
        $.beginPath(); $.arc(pp.x, pp.y - 4, 14, Math.PI, 0); $.stroke();
        $.globalAlpha = .05; $.beginPath(); $.arc(pp.x, pp.y - 4, 14, Math.PI, 0); $.fill();
        $.globalAlpha = 1; $.lineWidth = 1;
      }

      // デンジャーメーター（台座基部周りの小さな弧）
      const stg = B.armStage[i];
      if (stg > 0 || B.armWarn[i] > 0) {
        const arcEnd = -Math.PI / 2 + TAU * (stg / 6);
        $.strokeStyle = ON; $.lineWidth = 2;
        $.globalAlpha = stg >= 5 ? .35 : stg >= 3 ? .2 : .1;
        $.beginPath(); $.arc(pp.x, pp.y, 14, -Math.PI / 2, arcEnd); $.stroke();
        $.lineWidth = 1; $.globalAlpha = 1;
        // 警告点滅
        if (B.armWarn[i] > 0 && Math.floor(B.armWarn[i] / 4) % 2) {
          $.strokeStyle = ON; $.lineWidth = 2; $.globalAlpha = .2;
          circleS(pp.x, pp.y, 14); $.lineWidth = 1; $.globalAlpha = 1;
        }
      }

      // スチールフラッシュ
      if (B.stealAnim[0] === i && B.stealAnim[1] > 0) {
        $.globalAlpha = B.stealAnim[1] / 10; txtC('LOST!', pp.x, pp.y - 26, 7);
        onFill(B.stealAnim[1] / 10 * .12);
        circle(pp.x, pp.y, 18); $.globalAlpha = 1;
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
    // アルコーブ（呼吸するグロー付き）
    const safeGlow = B.pos === 0 ? .08 : .04;
    onFill(safeGlow + Math.sin(G.tick * .08) * .01); $.fillRect(SAFE_X - 22, SAFE_Y - 24, 44, 52); $.globalAlpha = 1;
    onStroke(.18); $.strokeRect(SAFE_X - 22, SAFE_Y - 24, 44, 52); $.globalAlpha = 1;
    // 角の装飾
    onFill(.12);
    $.fillRect(SAFE_X - 22, SAFE_Y - 24, 4, 4); $.fillRect(SAFE_X + 18, SAFE_Y - 24, 4, 4);
    $.fillRect(SAFE_X - 22, SAFE_Y + 24, 4, 4); $.fillRect(SAFE_X + 18, SAFE_Y + 24, 4, 4); $.globalAlpha = 1;
    // ラベル
    $.globalAlpha = B.pos === 0 ? .4 : .25; txt('SAFE', SAFE_X - 12, SAFE_Y - 20, 5); $.globalAlpha = 1;
    // 宝石チェスト（詳細）
    onFill(.35); $.fillRect(SAFE_X - 9, SAFE_Y + 8, 18, 11);
    $.globalAlpha = .2; $.fillRect(SAFE_X - 7, SAFE_Y + 6, 14, 3); // 蓋
    $.fillRect(SAFE_X - 10, SAFE_Y + 18, 20, 2); // 基部
    $.fillStyle = BG; $.globalAlpha = .3; $.fillRect(SAFE_X - 1, SAFE_Y + 12, 3, 3); // ロック
    $.globalAlpha = 1;
    // チェスト内の宝石（持っていない時）
    if (!B.hasGem && B.pos !== 0) {
      $.globalAlpha = .55; iGem(SAFE_X - 8, SAFE_Y - 10, true); $.globalAlpha = 1;
      // 宝石が誘う
      onFill(.04 + Math.sin(G.tick * .1) * .02);
      circle(SAFE_X, SAFE_Y - 2, 16); $.globalAlpha = 1;
      // きらめき
      if (G.tick % 18 < 2) {
        onFill(.2);
        $.fillRect(SAFE_X - 4 + Math.random() * 8, SAFE_Y - 12 + Math.random() * 6, 2, 2); $.globalAlpha = 1;
      }
    }

    // === アクティブプレイヤー（歩行補間付き） ===
    const destP = playerXY(B.pos);
    let plx = destP.x, ply = destP.y;
    if (B.walkT > 0) {
      const t = B.walkT / 6; // 1→0
      const fromP = playerXY(B.prevPos);
      plx = fromP.x + (destP.x - fromP.x) * (1 - t);
      ply = fromP.y + (destP.y - fromP.y) * (1 - t);
    }
    // ダメージ点滅
    if (!(B.hurtCD > 0 && Math.floor(G.tick / 3) % 2)) {
      const br = Math.sin(B.bossBreath) * .4;
      // 歩行 vs 待機スプライト
      if (B.walkT > 0 && Math.floor(B.walkT / 2) % 2) px(K_RW, plx - 10, ply - 12 + br, 2, true);
      else px(K_F, plx - 10, ply - 12 + br, 2, true);
      // 持っている宝石
      if (B.hasGem) {
        iGem(plx - 8, ply - 28, true);
        if (G.tick % 8 < 2) {
          onFill(.25);
          $.fillRect(plx - 3 + Math.random() * 6, ply - 30 + Math.random() * 5, 2, 2); $.globalAlpha = 1;
        }
      }
    }
    // 位置ハイライト
    onStroke(.15 + Math.sin(G.tick * .1) * .05);
    circleS(plx, ply + 2, 18); $.globalAlpha = 1;
    // 着地ダスト
    if (B.walkT === 4) {
      onFill(.12);
      $.fillRect(plx - 5, ply + 16, 3, 2); $.fillRect(plx + 2, ply + 16, 3, 2); $.globalAlpha = 1;
    }

    // === HUD ===
    const placed = B.peds.filter(p => p > 0).length;
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
        onFill(B.placeAnim[1] / 8 * .3);
        circle(gx + 5, gy + 5, 8); $.globalAlpha = 1;
      }
    }
    // シールド
    txt('SHLD', 286, 34, 5);
    for (let i = 0; i < B.shields; i++) {
      onStroke(.5);
      circleS(330 + i * 14, 38, 5);
      onFill(.08); circle(330 + i * 14, 38, 5); $.globalAlpha = 1;
    }
    // アクティブ腕カウント
    const activeN = B.armStage.filter(s => s > 0).length;
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
      // 腕が接近中のカウンターヒント
      if (B.armStage[pi] >= 3 && !B.armResting[pi] && B.counterCD <= 0) {
        $.globalAlpha = .5 + Math.sin(G.tick * .25) * .2;
        txt('↓:CTR', pp.x - 14, pp.y + 34, 5); $.globalAlpha = 1;
      }
    }
    if (B.pos === 0) {
      if (B.hasGem) { $.globalAlpha = .35; txt('← →', SAFE_X - 10, SAFE_Y - 32, 5); $.globalAlpha = 1; }
      else { $.globalAlpha = .25 + Math.sin(G.tick * .1) * .08; txt('GEM!', SAFE_X - 10, SAFE_Y - 32, 5); $.globalAlpha = 1; }
    }

    // カウンターフラッシュエフェクト（弾いた台座での放射状バースト）
    if (B.counterFlash[1] > 0 && B.counterFlash[0] >= 0) {
      const cfp = PED_POS[B.counterFlash[0]]; const cfa = B.counterFlash[1] / 8;
      $.strokeStyle = ON; $.lineWidth = 3; $.globalAlpha = cfa * .4;
      circleS(cfp.x, cfp.y, 8 + (8 - B.counterFlash[1]) * 4);
      // 放射線
      for (let r = 0; r < 6; r++) {
        const a = r * Math.PI / 3 + G.tick * .1; const rl = 10 + (8 - B.counterFlash[1]) * 3;
        $.beginPath(); $.moveTo(cfp.x + Math.cos(a) * 6, cfp.y + Math.sin(a) * 6);
        $.lineTo(cfp.x + Math.cos(a) * rl, cfp.y + Math.sin(a) * rl); $.stroke();
      }
      $.lineWidth = 1; $.globalAlpha = 1;
    }

    // カウンターCDインジケーター（プレイヤー下の小さなバー）
    if (B.counterCD > 0) {
      const maxCD = twoBeatDuration(); const cdPct = B.counterCD / maxCD;
      const pxy = playerXY(B.pos);
      $.fillStyle = GH; $.fillRect(pxy.x - 12, pxy.y + 20, 24, 3);
      $.fillStyle = ON; $.fillRect(pxy.x - 12, pxy.y + 20, Math.floor(24 * (1 - cdPct)), 3);
    }

    // レイジウェーブフラッシュ（画面端のパルス）
    if (B.rageWave > 0 || B.quake > 0) {
      const ra = Math.max(B.rageWave, B.quake) / 6;
      onFill(ra * .06); $.fillRect(0, 0, W, H); $.globalAlpha = 1;
    }
    // レイジウェーブ発動時の画面フラッシュ
    if (B.rageWave > 0 && B.rageWave < 8) {
      const rfa = (8 - B.rageWave) / 8;
      $.fillStyle = `rgba(40,10,0,${rfa * .15})`;
      $.fillRect(0, 0, W, H);
      $.globalAlpha = 1;
    }

    // パーティクル
    Particles.updateAndDraw(G.bosParticles);
    // ポップアップ
    Popups.updateAndDraw();

    // === 勝利演出 ===
    if (B.won) {
      const wt = B.wonT;
      // 初期フラッシュ
      if (wt < 4) { $.fillStyle = BG; $.globalAlpha = (4 - wt) / 4 * .4; $.fillRect(0, 0, W, H); $.globalAlpha = 1; }
      // ボスが震えて腕が引っ込む
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
        // ボスから溶解パーティクルがバースト
        if (wt > 15 && wt % 2 === 0) {
          onFill(.3);
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * TAU, r = Math.random() * 30 + 10;
            $.fillRect(BOS_CX + Math.cos(a) * r - 1, BOS_CY + Math.sin(a) * r - 1, 3, 3);
          }
          $.globalAlpha = 1;
        }
      }
      // 台座上の宝石がパルス
      if (wt < 70) {
        for (let i = 0; i < 6; i++) {
          const pp = PED_POS[i];
          onFill(Math.max(0, .22 * Math.sin(G.tick * .25 + i) - .012 * (wt - 20)));
          circle(pp.x, pp.y, 8 + Math.sin(G.tick * .25 + i) * 3);
        } $.globalAlpha = 1;
      }
      // オーバーレイ
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
      // 6つの宝石がきらめきと共に整列
      if (wt > 70) {
        for (let i = 0; i < 6; i++) {
          const delay = i * 4; const ga = Math.min(1, Math.max(0, (wt - 70 - delay) / 10));
          $.globalAlpha = ga; const bounce = ga < 1 ? 12 * (1 - ga) : Math.sin(G.tick * .12 + i) * .5;
          iGem(W / 2 - 55 + i * 20, 124 - bounce, true);
          // 宝石のきらめき
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
      // ストーリーのティーザー
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
      // 継続的なきらめき（散乱）
      if (wt > 20) {
        $.fillStyle = ON;
        for (let sp = 0; sp < 2; sp++) {
          const sx = 40 + (G.tick * 17 + sp * 127) % 360, sy = 50 + (G.tick * 11 + sp * 89 + wt * 5) % 200;
          $.globalAlpha = .15 + Math.sin(G.tick * .12 + sp) * .08; $.fillRect(sx, sy, 2, 2);
        } $.globalAlpha = 1;
      }
    }
  }

  /* ================================================================
     公開API
     ================================================================ */
  return { init: bosInit, update: bosUpdate, draw: bosDraw };
}
