/**
 * 全体回復スキルハンドラー
 */
import type { SkillHandler, SkillResult } from '../skill-handler';
import { withSkillBase } from './skill-handler-base';
import { deepCloneRun } from '../../shared/utils';

export const healAllHandler: SkillHandler = {
  execute(run, def) {
    // 回復禁止チェックは早期リターンが必要なため、ベース関数の外で処理
    if (def.fx.t === 'healAll' && run.noHealing) {
      const next = deepCloneRun(run);
      next.log.push({ x: `✦ ${def.ic} 回復禁止中…`, c: 'xc' });
      return { nextRun: next, events: [] } as SkillResult;
    }

    return withSkillBase('healAll', run, def, (next, fx, events, d) => {
      const heal = fx.bh;
      next.hp = Math.min(next.hp + heal, next.mhp);
      next.al.forEach(a => {
        if (a.a) a.hp = Math.min(a.hp + Math.floor(a.mhp * fx.aR), a.mhp);
      });
      next.log.push({ x: `✦ ${d.ic} ${d.nm} +${heal}`, c: 'lc' });
      events.push({ type: 'popup', v: heal, crit: false, heal: true, tgt: 'pl' });
      events.push({ type: 'sfx', sfx: 'skHeal' });
      events.push({ type: 'skill_fx', sid: d.id, v: heal });
    });
  },
};
