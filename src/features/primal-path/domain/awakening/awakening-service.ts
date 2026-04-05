/**
 * 覚醒サービス
 *
 * 覚醒ルールのチェック、覚醒効果の適用、覚醒情報の取得を担当する。
 */
import type { RunState, EvoEffect, CivTypeExt, AwakeningRule, AwakeningNext } from '../../types';
import { CIV_TYPES, TN, TC } from '../../constants';
import { civLvs, civMin } from '../shared/civ-utils';
import { applyStatFx, getSnap, writeSnapToRun, deepCloneRun } from '../shared/utils';

/** 次に解除可能な覚醒ルールを返す（小→大の順、Tier2 は 1 回のみ） */
export function checkAwakeningRules(r: RunState): AwakeningRule | null {
  const done = r.awoken.map(a => a.id);
  const lvs = civLvs(r);
  const mn = civMin(r);

  // Tier2 覚醒済みかチェック（fe が設定されていれば Tier2 は完了）
  const hasTier2 = r.fe !== null && r.fe !== undefined;

  const rules: AwakeningRule[] = [
    { id: 'sa_bal', t: 'bal', tier: 1, ok: mn >= 3 },
  ];
  CIV_TYPES.forEach(t => {
    rules.push({ id: 'sa_' + t, t, tier: 1, ok: lvs[t] >= r.saReq });
  });
  // Tier2 は hasTier2 でなければ候補に入れる
  if (!hasTier2) {
    rules.push({ id: 'fa_bal', t: 'bal', tier: 2, ok: mn >= 4 && done.indexOf('sa_bal') >= 0 });
    CIV_TYPES.forEach(t => {
      rules.push({ id: 'fa_' + t, t, tier: 2, ok: lvs[t] >= r.fReq });
    });
  }

  return rules.find(r2 => r2.ok && done.indexOf(r2.id) < 0) || null;
}

/** 覚醒効果を適用する */
export function applyAwkFx(r: RunState, fx: EvoEffect, id: string, nm: string, cl: string, fe: CivTypeExt | null): RunState {
  const next = deepCloneRun(r);
  writeSnapToRun(next, applyStatFx(getSnap(next), fx));
  if ((fx as Record<string, unknown>).allyAtkMul) {
    next.al.forEach(a => { if (a.a) a.atk *= (fx as Record<string, number>).allyAtkMul; });
  }
  if ((fx as Record<string, unknown>).allyFullHeal) {
    next.al.forEach(a => { if (a.a) a.hp = a.mhp; });
  }
  if (fe !== undefined) next.fe = fe;
  next.awoken.push({ id, nm, cl });
  return next;
}

/** 次の覚醒候補リスト（最大3個） */
export function awkInfo(r: RunState): AwakeningNext[] {
  const done = r.awoken.map(a => a.id);
  const lvs = civLvs(r);
  const mn = civMin(r);
  const nxt: AwakeningNext[] = [];

  if (mn < 3 && done.indexOf('sa_bal') < 0) {
    nxt.push({ nm: '調和・小', need: '全Lv3(残' + Math.max(0, 3 - mn) + ')', cl: '#e0c060' });
  }
  CIV_TYPES.forEach(t => {
    const sid = 'sa_' + t;
    if (lvs[t] < r.saReq && done.indexOf(sid) < 0) {
      nxt.push({ nm: TN[t] + '・小', need: TN[t] + 'Lv' + r.saReq + '(残' + Math.max(0, r.saReq - lvs[t]) + ')', cl: TC[t] });
    }
  });
  if (mn >= 3 && done.indexOf('sa_bal') >= 0 && mn < 4 && done.indexOf('fa_bal') < 0) {
    nxt.push({ nm: '調和・大', need: '全Lv4(残' + Math.max(0, 4 - mn) + ')', cl: '#e0c060' });
  }
  CIV_TYPES.forEach(t => {
    const fid = 'fa_' + t;
    if (lvs[t] < r.fReq && done.indexOf(fid) < 0) {
      nxt.push({ nm: TN[t] + '・大', need: TN[t] + 'Lv' + r.fReq + '(残' + Math.max(0, r.fReq - lvs[t]) + ')', cl: TC[t] });
    }
  });

  return nxt.slice(0, 3);
}
