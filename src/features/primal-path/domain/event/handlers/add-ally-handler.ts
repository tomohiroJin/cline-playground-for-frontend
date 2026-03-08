/**
 * 仲間追加イベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { ALT } from '../../../constants';
import { dominantCiv } from '../../shared/civ-utils';
import { deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const addAllyHandler: EventEffectHandler = {
  apply(run: RunState, effect: EventEffect, rng: () => number): RunState {
    if (effect.type !== 'add_ally') return run;
    const next = deepCloneRun(run);
    if (next.al.length < next.mxA) {
      const civType = dominantCiv(next);
      const templates = ALT[civType];
      const tmpl = templates[Math.floor(rng() * templates.length)];
      next.al.push({
        n: tmpl.n, hp: tmpl.hp, mhp: tmpl.hp, atk: tmpl.atk,
        t: tmpl.t, a: 1, h: tmpl.h, tk: tmpl.tk,
      });
    }
    return next;
  },
  getHintColor() { return '#50a0e0'; },
  getHintIcon() { return '🤝'; },
  formatResult(_effect: EventEffect, cost?: EventCost) {
    const base = { icon: '🤝', text: '仲間が加わった!' };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
