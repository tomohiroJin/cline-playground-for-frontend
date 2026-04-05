/**
 * ランサービス
 *
 * ラン開始、統計計算、報酬計算を担当する。
 */
import type { RunState, SaveData, BiomeId, Difficulty, RunStats } from '../../types';
import { DIFFS, WAVES_PER_BIOME, LOOP_SCALE_FACTOR } from '../../constants';
import { getTB } from './tree-service';
import { calcSynergies } from '../evolution/synergy-service';

/* ===== 定数 ===== */

/** 勝利時ボーン倍率 */
const WIN_BONE_MULTIPLIER = 1.5;
/** 儀式ボーン倍率 */
const RIT_BONE_MULTIPLIER = 1.5;

/* ===== ラン初期化 ===== */

/** ランの初期ステートを生成する */
export function startRunState(di: number, save: SaveData): RunState {
  const d = DIFFS[di];
  const tb = getTB(save.tree);
  /* Fisher-Yates シャッフル */
  const bms: BiomeId[] = ['grassland', 'glacier', 'volcano'];
  for (let i = bms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bms[i], bms[j]] = [bms[j], bms[i]];
  }

  // 周回倍率: 2周目以降は敵が強くなる
  const loopScale = 1 + (save.loopCount ?? 0) * LOOP_SCALE_FACTOR;
  const dd: Difficulty = {
    ...d,
    hm: d.hm * loopScale,
    am: d.am * loopScale,
  };

  return {
    hp: 80 + tb.bH, mhp: 80 + tb.bH, atk: 8 + tb.bA, def: 2 + tb.bD,
    cr: Math.min(0.05 + tb.cr, 1), burn: 0, aM: 1, dm: 1 + tb.dM,
    cT: tb.sC, cL: tb.sC, cR: tb.sC,
    al: [], bms,
    cB: 0, cBT: bms[0], cW: 0, wpb: WAVES_PER_BIOME, bE: 0, bb: 0,
    di, dd, fe: null, tb,
    mxA: 3 + tb.aS, evoN: 3 + tb.eN,
    fReq: 5 + tb.fQ, saReq: 4 + tb.aQ,
    rvU: 0, bc: 0, log: [], turn: 0, kills: 0,
    dmgDealt: 0, dmgTaken: 0, maxHit: 0, wDmg: 0, wTurn: 0,
    awoken: [],
    en: null,
    sk: { avl: [], cds: {}, bfs: [] },
    evs: [],
    btlCount: 0, eventCount: 0,
    skillUseCount: 0, totalHealing: 0,
    loopCount: save.loopCount ?? 0,
    isEndless: false,
    endlessWave: 0,
    _wDmgBase: 0, _fbk: '', _fPhase: 0,
  };
}

/* ===== 報酬計算 ===== */

/** 骨報酬を計算する（bE=バトル中収集骨、bb=ボス撃破ボーナス骨） */
export function calcBoneReward(r: RunState, won: boolean): number {
  let tb = r.bE + r.bb;
  tb = Math.floor(tb * r.dd.bm * (1 + r.tb.bM));
  if (r.fe === 'rit') tb = Math.floor(tb * RIT_BONE_MULTIPLIER);
  if (won) tb = Math.floor(tb * WIN_BONE_MULTIPLIER);
  return Math.max(tb, 1);
}

/** 仲間復活費用を計算する */
export function allyReviveCost(r: RunState): number {
  return Math.max(2, Math.floor(3 + r.bc * 2 + r.di * 1.5));
}

/* ===== 統計計算 ===== */

/** ラン終了時の統計を計算する */
export function calcRunStats(
  run: RunState,
  result: 'victory' | 'defeat',
  boneEarned: number,
): RunStats {
  const synergies = calcSynergies(run.evs);
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
    result,
    difficulty: run.di,
    biomeCount: run.bc,
    totalKills: run.kills,
    maxDamage: run.maxHit,
    totalDamageDealt: run.dmgDealt,
    totalDamageTaken: run.dmgTaken,
    totalHealing: run.totalHealing,
    evolutionCount: run.evs.length,
    synergyCount: synergies.length,
    eventCount: run.eventCount,
    skillUsageCount: run.skillUseCount,
    boneEarned,
    playtimeSeconds: 0,
    awakening: run.awoken.length > 0 ? run.awoken[run.awoken.length - 1].nm : undefined,
    challengeId: run.challengeId,
    endlessWave: run.isEndless ? run.endlessWave : undefined,
  };
}
