/**
 * スキルサービス
 *
 * アクティブスキルの解放判定、発動、バフ管理を担当する。
 */
import type { RunState, ASkillId, SkillSt, TickEvent } from '../../types';
import { A_SKILLS } from '../../constants';
import { civLvs } from '../shared/civ-utils';
import { deepCloneRun } from '../shared/utils';

/** 文明レベルからスキル解放判定 */
export function calcAvlSkills(r: RunState): ASkillId[] {
  const lvs = civLvs(r);
  const mn = Math.min(lvs.tech, lvs.life, lvs.rit);
  return A_SKILLS
    .filter(s => {
      if (s.ct === 'bal') return mn >= s.rL;
      return lvs[s.ct] >= s.rL;
    })
    .map(s => s.id);
}

/** スキル発動（純粋関数） */
export function applySkill(r: RunState, sid: ASkillId): { nextRun: RunState; events: TickEvent[] } {
  const def = A_SKILLS.find(s => s.id === sid);
  if (!def) return { nextRun: r, events: [] };

  // クールダウン中は不発
  if (r.sk.cds[sid] && r.sk.cds[sid]! > 0) return { nextRun: r, events: [] };

  const next = deepCloneRun(r);
  const events: TickEvent[] = [];
  const fx = def.fx;

  if (fx.t === 'dmgAll') {
    // 敵に固定ダメージ
    if (next.en) {
      const dmg = Math.floor(fx.bd * fx.mul);
      next.en.hp -= dmg;
      next.dmgDealt += dmg;
      next.log.push({ x: `✦ ${def.ic} ${def.nm} → ${dmg}`, c: 'gc' });
      events.push({ type: 'popup', v: dmg, crit: false, heal: false, tgt: 'en' });
      events.push({ type: 'sfx', sfx: 'skFire' });
      events.push({ type: 'skill_fx', sid, v: dmg });
    }
  } else if (fx.t === 'healAll') {
    // チャレンジ: 回復禁止
    if (next.noHealing) {
      next.log.push({ x: `✦ ${def.ic} 回復禁止中…`, c: 'xc' });
      return { nextRun: next, events: [] };
    }
    // プレイヤー回復
    const heal = fx.bh;
    next.hp = Math.min(next.hp + heal, next.mhp);
    // 仲間も回復
    next.al.forEach(a => {
      if (a.a) a.hp = Math.min(a.hp + Math.floor(a.mhp * fx.aR), a.mhp);
    });
    next.log.push({ x: `✦ ${def.ic} ${def.nm} +${heal}`, c: 'lc' });
    events.push({ type: 'popup', v: heal, crit: false, heal: true, tgt: 'pl' });
    events.push({ type: 'sfx', sfx: 'skHeal' });
    events.push({ type: 'skill_fx', sid, v: heal });
  } else if (fx.t === 'buffAtk') {
    // ATK倍率バフ + HP消費
    next.hp = Math.max(1, next.hp - fx.hC);
    next.sk.bfs.push({ sid, rT: fx.dur, fx: { ...fx } });
    next.log.push({ x: `✦ ${def.ic} ${def.nm} ATK×${fx.aM} ${fx.dur}T`, c: 'rc' });
    events.push({ type: 'sfx', sfx: 'skRage' });
    events.push({ type: 'skill_fx', sid, v: fx.aM });
  } else if (fx.t === 'shield') {
    // 被ダメ軽減バフ
    next.sk.bfs.push({ sid, rT: fx.dur, fx: { ...fx } });
    next.log.push({ x: `✦ ${def.ic} ${def.nm} -${Math.floor(fx.dR * 100)}% ${fx.dur}T`, c: 'cc' });
    events.push({ type: 'sfx', sfx: 'skShield' });
    events.push({ type: 'skill_fx', sid, v: fx.dR });
  }

  // クールダウン設定
  next.sk.cds[sid] = def.cd;
  // スキル使用回数記録
  next.skillUseCount++;

  return { nextRun: next, events };
}

/** バフターンデクリメント・消滅 */
export function tickBuffs(sk: SkillSt): SkillSt {
  const bfs = sk.bfs
    .map(b => ({ ...b, rT: b.rT - 1, fx: { ...b.fx } }))
    .filter(b => b.rT > 0);
  return { ...sk, bfs };
}

/** バトル終了時クールダウンデクリメント */
export function decSkillCds(sk: SkillSt): SkillSt {
  const cds: Partial<Record<ASkillId, number>> = {};
  for (const key in sk.cds) {
    const k = key as ASkillId;
    const v = (sk.cds[k] || 0) - 1;
    if (v > 0) cds[k] = v;
  }
  return { ...sk, cds, avl: [...sk.avl], bfs: sk.bfs.map(b => ({ ...b, fx: { ...b.fx } })) };
}
