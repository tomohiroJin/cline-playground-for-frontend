/**
 * ランダム進化イベントハンドラー
 */
import type { EventEffectHandler } from '../event-effect-handler';
import type { RunState, EventEffect, EventCost } from '../../../types';
import { CIV_KEYS, EVOS } from '../../../constants';
import { applyStatFx, getSnap, writeSnapToRun, deepCloneRun } from '../../shared/utils';
import { appendCostText } from './cost-helper';

export const randomEvolutionHandler: EventEffectHandler = {
  apply(run: RunState, effect: EventEffect, rng: () => number): RunState {
    if (effect.type !== 'random_evolution') return run;
    const next = deepCloneRun(run);
    const pool = EVOS.filter(e => !e.e.revA);
    if (pool.length > 0) {
      const evo = pool[Math.floor(rng() * pool.length)];
      next.evs.push(evo);
      const snap = applyStatFx(getSnap(next), evo.e);
      writeSnapToRun(next, snap);
      const key = CIV_KEYS[evo.t];
      next[key] += 1;
    }
    return next;
  },
  getHintColor() { return '#c060f0'; },
  getHintIcon() { return '🧬'; },
  formatResult(_effect: EventEffect, cost?: EventCost, evoName?: string) {
    const base = { icon: '🧬', text: evoName ? `${evoName} を獲得!` : 'ランダムな進化を獲得!' };
    if (cost) appendCostText(base, cost);
    return base;
  },
};
