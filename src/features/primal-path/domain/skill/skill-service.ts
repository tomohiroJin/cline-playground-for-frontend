/**
 * スキルサービス
 *
 * アクティブスキルの解放判定、発動、バフ管理を担当する。
 * スキル効果は SkillHandler レジストリにより拡張可能（OCP準拠）。
 */
import type { RunState, ASkillId, SkillSt, TickEvent } from '../../types';
import { A_SKILLS } from '../../constants';
import { civLvs } from '../shared/civ-utils';
import { skillRegistry } from './skill-registry';
import { requireValidPlayer } from '../../contracts/player-contracts';

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

/** スキル発動（純粋関数） — Registry ベースで効果を実行 */
export function applySkill(r: RunState, sid: ASkillId): { nextRun: RunState; events: TickEvent[] } {
  if (process.env.NODE_ENV !== 'production') {
    requireValidPlayer(r);
  }
  const def = A_SKILLS.find(s => s.id === sid);
  if (!def) return { nextRun: r, events: [] };

  // クールダウン中は不発
  if (r.sk.cds[sid] && r.sk.cds[sid]! > 0) return { nextRun: r, events: [] };

  // ハンドラーをレジストリから取得
  const handler = skillRegistry.get(def.fx.t);
  if (!handler) return { nextRun: r, events: [] };

  const result = handler.execute(r, def);

  // クールダウン設定とスキル使用回数記録
  const next = result.nextRun;
  next.sk.cds[sid] = def.cd;
  next.skillUseCount++;

  return { nextRun: next, events: [...result.events] };
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
