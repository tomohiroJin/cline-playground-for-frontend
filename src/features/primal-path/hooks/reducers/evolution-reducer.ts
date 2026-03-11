/**
 * 原始進化録 - PRIMAL PATH - 進化アクション Reducer
 */
import type { GameState, CivTypeExt } from '../../types';
import type { EvolutionAction } from '../actions';
import {
  applyEvo, startBattle, checkAwakeningRules, rollE,
  applyAwkFx,
} from '../../game-logic';
import { AWK_SA, AWK_FA } from '../../constants';

export function evolutionReducer(state: GameState, action: EvolutionAction): GameState {
  switch (action.type) {
    case 'SELECT_EVO': {
      if (!state.run) return state;
      // maxEvo ガード: 進化上限に達している場合はバトルへ直行
      if (state.run.maxEvo !== undefined && state.run.evs.length >= state.run.maxEvo) {
        const battleRun = startBattle(state.run, state.finalMode);
        battleRun.log.push({ x: `⚠️ 進化上限（${state.run.maxEvo}回）に達しました`, c: 'rc' });
        return { ...state, run: battleRun, phase: 'battle' };
      }
      const prevMhp = state.run.mhp;
      const { nextRun } = applyEvo(state.run, action.evo);
      // 覚醒チェック
      const awkRule = checkAwakeningRules(nextRun);
      if (awkRule) {
        return {
          ...state, run: nextRun,
          phase: 'awakening', pendingAwk: awkRule,
        };
      }
      // バトル開始
      const battleRun = startBattle(nextRun, state.finalMode);
      // 進化効果をバトルログに表示（HP半減等の重要効果を明示）
      if (action.evo.e.half) {
        battleRun.log.push({ x: `💀 ${action.evo.n}発動！ HP ${prevMhp} → ${battleRun.mhp}`, c: 'rc' });
      }
      if (action.evo.e.aM && action.evo.e.aM > 1) {
        battleRun.log.push({ x: `⚡ ATK倍率 ×${battleRun.aM}`, c: 'gc' });
      }
      return { ...state, run: battleRun, phase: 'battle' };
    }

    case 'SKIP_EVO': {
      if (!state.run) return state;
      const battleRun = startBattle(state.run, state.finalMode);
      return { ...state, run: battleRun, phase: 'battle' };
    }

    case 'SHOW_EVO': {
      if (!state.run) return state;
      const evoPicks = rollE(state.run);
      return { ...state, phase: 'evo', evoPicks };
    }

    case 'PROCEED_AFTER_AWK': {
      if (!state.run) return state;
      // さらなる覚醒をチェック
      const awkRule = checkAwakeningRules(state.run);
      if (awkRule) {
        return { ...state, pendingAwk: awkRule };
      }
      // バトル開始
      const battleRun = startBattle(state.run, state.finalMode);
      return { ...state, run: battleRun, phase: 'battle', pendingAwk: null };
    }

    case 'PROCEED_TO_BATTLE': {
      if (!state.run || !state.pendingAwk) return state;
      const awk = state.pendingAwk;
      const info = awk.tier === 1
        ? AWK_SA[awk.t as CivTypeExt]
        : AWK_FA[awk.t as CivTypeExt];
      const fe = awk.tier === 2 ? awk.t : undefined;
      const nextRun = applyAwkFx(
        state.run, info.fx, awk.id, info.nm, info.cl,
        fe !== undefined ? fe : null,
      );
      // さらなる覚醒をチェック
      const nextAwk = checkAwakeningRules(nextRun);
      if (nextAwk) {
        return { ...state, run: nextRun, pendingAwk: nextAwk };
      }
      // バトル開始
      const battleRun = startBattle(nextRun, state.finalMode);
      // 血の契約等のHP半減効果がある場合、バトルログに表示
      if (battleRun.aM > 1) {
        battleRun.log.push({ x: `⚡ ATK倍率 ×${battleRun.aM}`, c: 'gc' });
      }
      return { ...state, run: battleRun, phase: 'battle', pendingAwk: null };
    }

    default:
      return state;
  }
}
