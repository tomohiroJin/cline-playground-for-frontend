/**
 * 全体ダメージスキルハンドラー
 */
import type { SkillHandler } from '../skill-handler';
import { withSkillBase } from './skill-handler-base';

export const dmgAllHandler: SkillHandler = {
  execute(run, def) {
    return withSkillBase('dmgAll', run, def, (next, fx, events, d) => {
      if (!next.en) return;
      const dmg = Math.floor(fx.bd * fx.mul);
      next.en.hp -= dmg;
      next.dmgDealt += dmg;
      next.log.push({ x: `✦ ${d.ic} ${d.nm} → ${dmg}`, c: 'gc' });
      events.push({ type: 'popup', v: dmg, crit: false, heal: false, tgt: 'en' });
      events.push({ type: 'sfx', sfx: 'skFire' });
      events.push({ type: 'skill_fx', sid: d.id, v: dmg });
    });
  },
};
