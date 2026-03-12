/**
 * KEYS & ARMS — ボスステージロジックモジュール
 * ボスステージの初期化と状態更新（ゲームロジック）を担当する。
 */

import {
  TICK_RATE, BOS_CX, BOS_CY, PED_POS,
  assert
} from '../../constants';

import { rng, rngInt, shuffle } from '../../core/math';
import { Difficulty } from '../../difficulty';

import type { EngineContext } from '../../types';

/**
 * ボスロジックファクトリ
 * @param ctx ゲームコンテキスト
 * @returns bosInit, bosUpdate 関数
 */
export function createBossLogic(ctx: EngineContext) {
  const { G, audio, particles, hud } = ctx;
  const { S, ea } = audio;
  const { Particles, Popups } = particles;
  const { twoBeatDuration, doHurt, transTo } = hud;

  // --- 入力ヘルパー ---
  function J(k: string) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  /** ポップアップ追加のショートカット */
  function addPopup(x: number, y: number, t: string) { Popups.add(x, y, t); }

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

  // === ボス更新 ===
  function bosUpdate(nb: boolean) {
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
        B.armStage[pi] = 0; B.armResting[pi] = true;
        B.armRestT[pi] = Math.max(2, B.armBaseRest + 2);
        B.armDir[pi] = 1; B.counterCD = twoBeatDuration();
        B.counterFlash = [pi, 8];
        G.score += 300 * G.loop; addPopup(PED_POS[pi].x, PED_POS[pi].y - 20, 'COUNTER!');
        S.kill(); G.hitStop = 3;
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

  return { bosInit, bosUpdate };
}
