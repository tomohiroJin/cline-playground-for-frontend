/**
 * ボスサービス
 *
 * 最終ボスの選出・開始・撃破処理を担当する。
 */
import type { RunState } from '../../types';
import { BOSS, FINAL_BOSS_ORDER, BOSS_CHAIN_SCALE } from '../../constants';
import { scaleEnemy } from './combat-calculator';
import { deepCloneRun } from '../shared/utils';

/** 最高文明からボスキーを決定する（覚醒優先） */
export function resolveFinalBossKey(r: RunState): string {
  const map: Record<string, string> = { tech: 'ft', life: 'fl', rit: 'fr' };
  if (r.fe && map[r.fe]) return map[r.fe];
  return r.cT >= r.cL && r.cT >= r.cR ? 'ft' : r.cL >= r.cR ? 'fl' : 'fr';
}

/** 最終ボス戦を開始する */
export function startFinalBoss(r: RunState): { nextRun: RunState; bossKey: string } {
  const bk = resolveFinalBossKey(r);
  const next = deepCloneRun(r);
  next._fbk = bk;
  next._fPhase = 1;
  next.cBT = 'final';
  next.en = scaleEnemy(BOSS[bk], next.dd.hm, next.dd.am, 1);
  next.cW = next.wpb + 1;
  next.log = [];
  next.wTurn = 0;
  next._wDmgBase = next.dmgDealt;
  return { nextRun: next, bossKey: bk };
}

/** ボス撃破時処理（連戦/勝利判定） */
export function handleFinalBossKill(r: RunState): { nextRun: RunState; gameWon: boolean } {
  const next = deepCloneRun(r);
  if (next._fPhase < next.dd.bb) {
    next._fPhase++;
    // HP を最大HPの20%回復
    const rec = Math.floor(next.mhp * 0.2);
    next.hp = Math.min(next.hp + rec, next.mhp);
    // FINAL_BOSS_ORDER から次のボスを選出
    const order = FINAL_BOSS_ORDER[next._fbk];
    const nextBossKey = order
      ? order[Math.min(next._fPhase - 1, order.length - 1)]
      : next._fbk;
    // BOSS_CHAIN_SCALE でスケーリング
    const chainScale = BOSS_CHAIN_SCALE[Math.min(next._fPhase - 1, BOSS_CHAIN_SCALE.length - 1)];
    next.en = scaleEnemy(BOSS[nextBossKey], next.dd.hm, next.dd.am, chainScale);
    // 戦闘状態リセット
    next.log = [];
    next.wTurn = 0;
    next._wDmgBase = next.dmgDealt;
    return { nextRun: next, gameWon: false };
  }
  return { nextRun: next, gameWon: true };
}
