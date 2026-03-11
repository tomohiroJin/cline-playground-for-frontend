/**
 * ステータス変更イベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const statChangeHandler: EventEffectHandler = {
  apply(run: RunState, effect: EventEffect, _rng: () => number): RunState {
    if (effect.type !== 'stat_change') return run;
    const next = deepCloneRun(run);
    if (effect.stat === 'hp') next.mhp += effect.value;
    if (effect.stat === 'atk') next.atk += effect.value;
    if (effect.stat === 'def') next.def += effect.value;
    return next;
  },
  getHintColor() { return '#f0c040'; },
  getHintIcon() { return '📈'; },
  formatResult(effect: EventEffect, cost?: EventCost) {
    if (effect.type !== 'stat_change') return { icon: '📈', text: '' };
    const statName = effect.stat === 'hp' ? '最大HP' : effect.stat === 'atk' ? 'ATK' : 'DEF';
    const icon = effect.stat === 'hp' ? '❤️' : effect.stat === 'atk' ? '💪' : '🛡️';
    const sign = effect.value >= 0 ? '+' : '';
    const base = { icon, text: `${statName} ${sign}${effect.value}!` };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
