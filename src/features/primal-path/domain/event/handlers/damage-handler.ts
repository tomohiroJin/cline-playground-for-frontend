/**
 * ダメージイベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const damageHandler: EventEffectHandler = {
  apply(run: RunState, effect: EventEffect, _rng: () => number): RunState {
    if (effect.type !== 'damage') return run;
    const next = deepCloneRun(run);
    next.hp = Math.max(1, next.hp - effect.amount);
    return next;
  },
  getHintColor() { return '#f05050'; },
  getHintIcon() { return '💔'; },
  formatResult(effect: EventEffect, cost?: EventCost) {
    if (effect.type !== 'damage') return { icon: '💔', text: '' };
    const base = { icon: '💔', text: `${effect.amount} ダメージを受けた!` };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
