/**
 * 無効果イベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const nothingHandler: EventEffectHandler = {
  apply(run: RunState, _effect: EventEffect, _rng: () => number): RunState {
    return deepCloneRun(run);
  },
  getHintColor() { return '#606060'; },
  getHintIcon() { return '…'; },
  formatResult(_effect: EventEffect, cost?: EventCost) {
    const base = { icon: '…', text: '何も起こらなかった' };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
