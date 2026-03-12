/**
 * KEYS & ARMS — 洞窟ステージロジックモジュール
 * 洞窟ステージの初期化と状態更新（ゲームロジック）を担当する。
 */

import {
  L1T,
  KY2, POS, NAV, ROOM_NAMES,
  W, H,
  assert
} from '../../constants';

import { rng, rngInt, rngSpread } from '../../core/math';

import { Difficulty } from '../../difficulty';

import type { EngineContext, ParticlePool } from '../../types';

/**
 * 洞窟ロジックファクトリ
 * @param ctx ゲームコンテキスト
 * @returns cavInit, cavUpdate 関数
 */
export function createCaveLogic(ctx: EngineContext) {
  const { G, audio, particles, hud } = ctx;
  const { S, ea } = audio;
  const { Particles, Popups } = particles;
  const { twoBeatDuration, doHurt, transTo } = hud;

  // --- 入力ヘルパー ---
  function J(k: string) { return G.jp[k.toLowerCase()]; }
  function jAct() { return J('z') || J(' '); }

  // --- ヘルパー ---
  function addPopup(x: number, y: number, t: string) { Popups.add(x, y, t); }

  function initDust() {
    G.dust = [];
    for (let i = 0; i < 15; i++)
      G.dust.push({ x: rng(0, W), y: rng(30, H - 30), vx: rngSpread(.15), vy: rngSpread(.075), s: rng(1, 3), a: rng(.06, .14) });
  }

  function addStepDust(x: number, y: number) {
    Particles.spawn(G.stepDust as unknown as ParticlePool, { x, y, n: 4, vxSpread: .6, vySpread: .4, vyBase: -.4, life: 12, s: 1.5 });
  }

  // === 洞窟初期化 ===
  function cavInit() {
    assert(G.loop >= 1, 'cavInit: loop must be >= 1');
    G.state = 'cave'; G.beatCtr = 0; G.beatNum = 0; G.sparks = []; G.feathers = []; G.smoke = []; G.stepDust = []; Popups.clear(); G.keySpk = []; initDust();
    G.cav = {
      pos: 0, prevPos: -1, dir: 1, keys: [false, false, false], keysPlaced: 0, carrying: false,
      trapOn: false, trapBeat: 0, trapSparks: [], trapWasDanger: false,
      cageProgress: 0, cageMax: Difficulty.cageMax(G.loop), cageHolding: false,
      batPhase: 0, batBeat: 0, batHitAnim: 0, batWasDanger: false,
      mimicOpen: false, mimicBeat: 0, pryCount: 0, mimicShake: 0, mimicWasDanger: false, pryDecayT: 0,
      spiderY: 0, spiderBeat: 0, spiderWasDanger: false,
      hurtCD: 0, actAnim: 0, actType: '', walkAnim: 0, idleT: 0, won: false, wonT: 0,
      trailAlpha: 0, roomNameT: 0, roomName: 'ENTRANCE'
    };
  }

  // === 洞窟更新 ===
  function cavUpdate(nb: boolean) {
    const C = G.cav; if (C.hurtCD > 0) C.hurtCD--; if (C.actAnim > 0) C.actAnim--; if (C.batHitAnim > 0) C.batHitAnim--;
    if (C.mimicShake > 0) C.mimicShake--; if (C.walkAnim > 0) C.walkAnim--; if (C.won) { C.wonT++; if (C.wonT === 120) transTo('PRAIRIE', G.grsInit, 'DEFEAT ENEMIES'); return; }
    if (C.trailAlpha > 0) C.trailAlpha -= .03; if (C.roomNameT > 0) C.roomNameT--;
    C.idleT++;
    // 鍵所持中のきらめき
    if (C.carrying && G.tick % 4 === 0) G.keySpk.push({ x: POS[C.pos].x - 4 + rng(0, 12), y: POS[C.pos].y - 6 + rng(0, 6), life: 10 });
    if (C.actAnim <= 0) {
      const n = NAV[C.pos]; let moved = false; const oldPos = C.pos;
      if (J('arrowleft') && n.l !== undefined) { C.pos = n.l; C.dir = -1; moved = true; }
      if (J('arrowright') && n.r !== undefined) { C.pos = n.r; C.dir = 1; moved = true; }
      if (J('arrowdown') && n.d !== undefined) { C.prevPos = C.pos; C.trailAlpha = .3; C.pos = n.d; S.ladder(); C.walkAnim = 4; C.idleT = 0; addStepDust(POS[C.pos].x, POS[C.pos].y + 20); C.roomNameT = 25; C.roomName = ROOM_NAMES[C.pos]; }
      else if (J('arrowup') && n.u !== undefined) { C.prevPos = C.pos; C.trailAlpha = .3; C.pos = n.u; S.ladder(); C.walkAnim = 4; C.idleT = 0; addStepDust(POS[C.pos].x, POS[C.pos].y + 20); C.roomNameT = 25; C.roomName = ROOM_NAMES[C.pos]; }
      else if (moved) { C.prevPos = oldPos; C.trailAlpha = .3; S.step(); C.walkAnim = 3; C.idleT = 0; addStepDust(POS[C.pos].x, POS[C.pos].y + 20);
        if (ROOM_NAMES[C.pos] !== ROOM_NAMES[oldPos]) { C.roomNameT = 40; C.roomName = ROOM_NAMES[C.pos]; } } }
    // === CAGE HOLD メカニクス（TRAPの鍵、pos 9）===
    const actHeld = G.kd['z'] || G.kd[' '];
    C.cageHolding = false;
    if (C.pos === 9 && !C.keys[0] && !C.carrying && !C.trapOn && actHeld && C.hurtCD <= 0 && C.actAnim <= 0) {
      ea(); C.cageHolding = true; C.idleT = 0; C.cageProgress += 2.5;
      if (G.tick % 3 === 0) S.pry();
      if (C.cageProgress >= C.cageMax) { C.keys[0] = true; C.carrying = true; G.score += 300 * G.loop; S.grab(); C.actAnim = 8; C.actType = 'reach'; addPopup(POS[9].x, POS[9].y - 14, '+' + 300 * G.loop); C.cageProgress = 0; } }
    // ケージ未ホールド時の減衰 — 極めて遅く、ほぼ気付かない
    if (!C.cageHolding && C.cageProgress > 0) C.cageProgress = Math.max(0, C.cageProgress - .05);
    // トラップ放電時のケージ進捗への影響
    if (C.pos === 9 && C.trapOn && C.cageProgress > 0) C.cageProgress = Math.max(0, C.cageProgress - .5);

    // === MIMIC 連打減衰 — 極めて遅く、長時間不在時のみ進捗減少 ===
    if (C.pos === 5 && !C.keys[2] && !C.mimicOpen && C.pryCount > 0) { C.pryDecayT++;
      if (C.pryDecayT >= 180) { C.pryDecayT = 0; C.pryCount = Math.max(0, C.pryCount - 1); } }
    else C.pryDecayT = 0;
    if (C.pos !== 5 && C.pryCount > 0 && G.tick % 120 === 0) C.pryCount = Math.max(0, C.pryCount - 1);

    if (jAct() && C.hurtCD <= 0 && C.actAnim <= 0) { ea(); C.idleT = 0;
      if (C.pos === 4 && !C.keys[1] && !C.carrying && C.batPhase === 0) { C.keys[1] = true; C.carrying = true; G.score += 300 * G.loop; S.grab(); C.actAnim = 8; C.actType = 'atk'; C.batHitAnim = 10; C.dir = -1; addPopup(POS[4].x, POS[4].y - 14, '+' + 300 * G.loop);
        for (let i = 0; i < 8; i++) G.feathers.push({ x: POS[4].x, y: L1T + 10, vx: rngSpread(1.5), vy: -rng(0, 2) - 1, life: 12 }); }
      if (C.pos === 5 && !C.keys[2] && !C.carrying && !C.mimicOpen) {
        C.pryCount++; C.pryDecayT = 0; C.actAnim = 3; C.actType = 'pry'; S.pry(); C.mimicShake = 3; C.dir = 1;
        if (C.pryCount >= 5) { C.keys[2] = true; C.carrying = true; G.score += 300 * G.loop; S.grab(); C.actAnim = 8; C.actType = 'reach'; addPopup(POS[5].x, POS[5].y - 14, '+' + 300 * G.loop); } }
      if (C.pos === 10 && C.carrying && C.spiderY === 0) { C.carrying = false; C.keysPlaced++; G.score += 500 * G.loop; S.set(); C.actAnim = 8; C.actType = 'reach'; addPopup(POS[10].x, POS[10].y - 14, '+' + 500 * G.loop);
        if (C.keysPlaced >= 3) { C.won = true; C.wonT = 0; S.clear(); G.score += 2000 * G.loop; if (G.hp < G.maxHp) G.hp++; addPopup(W / 2, H / 2 - 30, '+' + 2000 * G.loop); } } }
    // 受動ダメージ
    if (C.hurtCD <= 0 && C.actAnim <= 0) {
      if (C.pos === 9 && C.trapOn && !C.keys[0]) { C.hurtCD = twoBeatDuration(); S.zap(); C.actAnim = 8; C.actType = 'hurt'; doHurt(); C.idleT = 0;
        for (let i = 0; i < 6; i++) C.trapSparks.push({ x: POS[9].x + rng(-10, 10), y: KY2 - 6 + rng(0, 10), vx: rngSpread(1.5), vy: -rng(0, 2) - 1, l: 6 }); }
      if (C.pos === 4 && C.batPhase === 2 && !C.keys[1]) { C.hurtCD = twoBeatDuration(); S.hit(); C.actAnim = 8; C.actType = 'hurt'; doHurt(); C.idleT = 0; }
      if (C.pos === 5 && C.mimicOpen && !C.keys[2]) { C.hurtCD = twoBeatDuration(); C.pryCount = Math.max(0, C.pryCount - 2); C.actAnim = 8; C.actType = 'hurt'; S.hit(); doHurt(); C.idleT = 0; }
      if (C.pos === 10 && C.spiderY === 2) { C.hurtCD = twoBeatDuration(); C.actAnim = 8; C.actType = 'hurt'; S.hit(); doHurt(); C.idleT = 0;
        if (C.carrying) { C.carrying = false; for (let i = 2; i >= 0; i--) { if (C.keys[i]) { C.keys[i] = false; break; } } } } }
    C.trapSparks = C.trapSparks.filter(s => { s.x += s.vx; s.y += s.vy; s.l--; return s.l > 0; });
    if (!nb) return;
    // 環境水滴
    if (G.beatNum % 4 === 0 && G.cavDrips.length < 3) {
      const dx = [85, 260, 350][rngInt(0, 2)];
      G.cavDrips.push({ x: dx + rng(-5, 5), y: L1T + 2, vy: 0, life: 40 });
      if (rng() > .6) S.drip(); }
    // ビート更新（安全インジケータ付き）
    const prevTrap = C.trapOn, prevBat = C.batPhase, prevMim = C.mimicOpen, prevSp = C.spiderY;
    C.trapBeat++; const tp = Difficulty.hazardCycle(G.loop, 6); C.trapOn = (C.trapBeat % tp) >= (tp - 2);
    C.batBeat++; const bp = Difficulty.hazardCycle(G.loop, 7); const bc = C.batBeat % bp;
    if (bc < Math.floor(bp * .4)) C.batPhase = 0; else if (bc < Math.floor(bp * .7)) C.batPhase = 1; else C.batPhase = 2;
    C.mimicBeat++; const mp = Difficulty.hazardCycle(G.loop, 6); C.mimicOpen = (C.mimicBeat % mp) >= (mp - 2);
    C.spiderBeat++; const sp = Difficulty.hazardCycle(G.loop, 7); const sc2 = C.spiderBeat % sp;
    if (sc2 < Math.floor(sp * .35)) C.spiderY = 0; else if (sc2 < Math.floor(sp * .6)) C.spiderY = 1; else C.spiderY = 2;
    // 危険→安全遷移の追跡
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- 既存の危険→安全遷移ロジック
    if (prevTrap && !C.trapOn) C.trapWasDanger = true; else if (!C.trapOn) C.trapWasDanger && (C.trapWasDanger = !!(C.trapWasDanger = 8));
    if (prevBat === 2 && C.batPhase === 0) C.batWasDanger = 8;
    if (prevMim && !C.mimicOpen) C.mimicWasDanger = 8;
    if (prevSp === 2 && C.spiderY === 0) C.spiderWasDanger = 8;
    if (typeof C.trapWasDanger === 'number' && C.trapWasDanger > 0) C.trapWasDanger--;
    if (typeof C.batWasDanger === 'number' && C.batWasDanger > 0) C.batWasDanger--;
    if (typeof C.mimicWasDanger === 'number' && C.mimicWasDanger > 0) C.mimicWasDanger--;
    if (typeof C.spiderWasDanger === 'number' && C.spiderWasDanger > 0) C.spiderWasDanger--;
  }

  return { cavInit, cavUpdate };
}
