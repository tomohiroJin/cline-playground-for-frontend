/**
 * 骨変更イベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const boneChangeHandler: EventEffectHandler = {
  apply(run: RunState, effect: EventEffect, _rng: () => number): RunState {
    if (effect.type !== 'bone_change') return run;
    const next = deepCloneRun(run);
    next.bE += effect.amount;
    return next;
  },
  getHintColor() { return '#c0a040'; },
  getHintIcon() { return '🦴'; },
  formatResult(effect: EventEffect, cost?: EventCost) {
    if (effect.type !== 'bone_change') return { icon: '🦴', text: '' };
    const sign = effect.amount >= 0 ? '+' : '';
    const base = { icon: '🦴', text: `骨 ${sign}${effect.amount}!` };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
