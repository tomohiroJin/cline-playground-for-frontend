/**
 * ATKバフスキルハンドラー
 */
import type { SkillHandler } from '../skill-handler';
import { withSkillBase } from './skill-handler-base';

export const buffAtkHandler: SkillHandler = {
  execute(run, def) {
    return withSkillBase('buffAtk', run, def, (next, fx, events, d) => {
      next.hp = Math.max(1, next.hp - fx.hC);
      next.sk.bfs.push({ sid: d.id, rT: fx.dur, fx: { ...fx } });
      next.log.push({ x: `✦ ${d.ic} ${d.nm} ATK×${fx.aM} ${fx.dur}T`, c: 'rc' });
      events.push({ type: 'sfx', sfx: 'skRage' });
      events.push({ type: 'skill_fx', sid: d.id, v: fx.aM });
    });
  },
};
