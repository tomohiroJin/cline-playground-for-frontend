/**
 * 文明レベルアップイベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { dominantCiv } from '../../shared/civ-utils';
import { deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const civLevelUpHandler: EventEffectHandler = {
  apply(run: RunState, effect: EventEffect, _rng: () => number): RunState {
    if (effect.type !== 'civ_level_up') return run;
    const next = deepCloneRun(run);
    const targetCiv = effect.civType === 'dominant'
      ? dominantCiv(next)
      : effect.civType;
    if (targetCiv === 'tech') next.cT += 1;
    else if (targetCiv === 'life') next.cL += 1;
    else if (targetCiv === 'rit') next.cR += 1;
    return next;
  },
  getHintColor() { return '#f0c040'; },
  getHintIcon() { return '🏛️'; },
  formatResult(_effect: EventEffect, cost?: EventCost) {
    const base = { icon: '📈', text: '文明レベルが上がった!' };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
