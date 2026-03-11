/**
 * 回復イベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const healHandler: EventEffectHandler = {
  apply(run: RunState, effect: EventEffect, _rng: () => number): RunState {
    if (effect.type !== 'heal') return run;
    const next = deepCloneRun(run);
    next.hp = Math.min(next.mhp, next.hp + effect.amount);
    return next;
  },
  getHintColor() { return '#50e090'; },
  getHintIcon() { return '💚'; },
  formatResult(effect: EventEffect, cost?: EventCost) {
    if (effect.type !== 'heal') return { icon: '💚', text: '' };
    const base = { icon: '💚', text: `HP ${effect.amount} 回復!` };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
