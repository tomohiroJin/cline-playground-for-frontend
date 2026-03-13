/**
 * KEYS & ARMS — 草原ステージロジックモジュール
 * 草原ステージの初期化と状態更新（ゲームロジック）を担当する。
 */

import { W, GRS_LY, GRS_EX, assert, VICTORY_TIMER, SHIELD_KILL_INTERVAL } from '../../constants';
import { createInputHelpers } from '../../core/input';
import { TAU, rng, rngInt } from '../../core/math';
import { Difficulty } from '../../difficulty';

import type { EngineContext, PrairieState } from '../../types';

/**
 * 草原ロジックファクトリ
 * @param ctx ゲームコンテキスト
 * @returns grsInit, grsUpdate 関数
 */
export function createPrairieLogic(ctx: EngineContext) {
  const { G, audio, particles, hud } = ctx;
  const { S } = audio;
  const { Particles, Popups } = particles;
  const { BL, twoBeatDuration, doHurt, transTo } = hud;

  // --- 入力ヘルパー ---
  const { J } = createInputHelpers(G.jp);

  /** ポップアップ追加のショートカット */
  function addPopup(x: number, y: number, t: string) { Popups.add(x, y, t); }

  /** 草の初期化 */
  function initGrass() {
    G.grsGrass = [];
    for (let i = 0; i < 30; i++) G.grsGrass.push({
      x: rng(0, W), y: GRS_LY[rngInt(0, 2)] + rng(42, 48), h: rng(3, 8), ph: rng(0, TAU)
    });
  }

  /** レーン位置にデスパーティクルを生成 — スウィープ/攻撃/ガードキル共通 */
  function grsDeathParticles(lane: number, n: number, spread: number) {
    const ex = GRS_EX[0] + 70, ey = GRS_LY[lane] + 14;
    Particles.spawn(G.grsDead, { x: ex, y: ey, n, vxSpread: spread, vySpread: spread * .7, life: 12, s: 3, rot: true });
  }

  /** シールドオーブドロップの確認・付与 — スウィープ/通常キル共通 */
  function grsCheckShieldDrop(GS: PrairieState, lane: number) {
    if (GS.kills >= GS.nextShieldAt && G.earnedShields < 4) {
      G.earnedShields++; GS.nextShieldAt += SHIELD_KILL_INTERVAL;
      GS.shieldOrbs.push({ y: GRS_LY[lane] + 20, alpha: 1, t: 0 });
      addPopup(W / 2, 20, 'SHIELD +1'); S.guard();
    }
  }

  /** キル時のコンボ加算 — スウィープ/通常パス共通 */
  function grsComboHit(GS: PrairieState) {
    GS.kills++; GS.combo++; GS.comboT = BL() * 5;
    if (GS.combo > GS.maxCombo) GS.maxCombo = GS.combo;
  }

  /** 敵ファクトリ — Difficultyモジュールから構成 */
  function spawnEnemy(GS: PrairieState) {
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

  // === 草原初期化 ===
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
      shieldOrbs: [], nextShieldAt: SHIELD_KILL_INTERVAL,
      sweepReady: false, sweepFlash: 0
    };
  }

  // === 草原更新 ===
  function grsUpdate(nb: boolean) {
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
    if (GS.won) { GS.wonT++; if (GS.wonT === VICTORY_TIMER) transTo('CASTLE', G.bosInit, 'SET 6 GEMS'); return; }
    GS.ens.forEach(e => { if (e.dashFlash > 0) e.dashFlash--; if (e.spawnT > 0) e.spawnT--; });

    // 攻撃 (↑→↓ = レーン 0,1,2)
    if (GS.atkCD <= 0) {
      const ak: [string, number][] = [['arrowup', 0], ['arrowright', 1], ['arrowdown', 2]];
      for (const [k, l] of ak) {
        if (J(k)) {
          GS.atkAnim = [l, 5]; GS.atkCD = 2; S.kill();
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

  return { grsInit, grsUpdate };
}
