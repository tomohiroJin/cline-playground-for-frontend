/**
 * シールドスキルハンドラー
 */
import type { SkillHandler } from '../skill-handler';
import { withSkillBase } from './skill-handler-base';

export const shieldHandler: SkillHandler = {
  execute(run, def) {
    return withSkillBase('shield', run, def, (next, fx, events, d) => {
      next.sk.bfs.push({ sid: d.id, rT: fx.dur, fx: { ...fx } });
      next.log.push({ x: `✦ ${d.ic} ${d.nm} -${Math.floor(fx.dR * 100)}% ${fx.dur}T`, c: 'cc' });
      events.push({ type: 'sfx', sfx: 'skShield' });
      events.push({ type: 'skill_fx', sid: d.id, v: fx.dR });
    });
  },
};
