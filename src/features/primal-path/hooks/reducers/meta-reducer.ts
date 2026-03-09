/**
 * 原始進化録 - PRIMAL PATH - メタアクション Reducer
 */
import type { GameState } from '../../types';
import type { MetaAction } from '../actions';
import {
  calcBoneReward, calcRunStats, deadAllies, allyReviveCost,
  applyEndlessLoop, applyFirstBiome,
} from '../../game-logic';
import { FRESH_SAVE, TREE as TREE_DATA } from '../../constants';
import { MetaStorage } from '../../storage';
import {
  transitionAfterBiome, transitionToEvoPicks,
  updateAggregate, checkAllAchievements,
  FULL_REVIVE_COST_MULTIPLIER,
} from '../reducer-helpers';

export function metaReducer(state: GameState, action: MetaAction): GameState {
  switch (action.type) {
    case 'LOAD_SAVE':
      return { ...state, save: { ...action.save } };

    case 'BUY_TREE_NODE': {
      const { nodeId } = action;
      const nd = TREE_DATA.find(x => x.id === nodeId);
      if (!nd) return state;
      if (state.save.tree[nodeId]) return state;
      if (state.save.bones < nd.c) return state;
      const save = {
        ...state.save,
        bones: state.save.bones - nd.c,
        tree: { ...state.save.tree, [nodeId]: 1 },
      };
      return { ...state, save };
    }

    case 'RETURN_TO_TITLE':
      return { ...state, phase: 'title', run: null, finalMode: false, gameResult: null };

    case 'GAME_OVER': {
      if (!state.run || state.phase !== 'battle') return state;
      const boneReward = calcBoneReward(state.run, action.won);
      const save = { ...state.save, bones: state.save.bones + boneReward };
      if (action.won) {
        save.clears = save.clears + 1;
        save.best = { ...save.best, [state.run.di]: 1 };
      }
      return { ...state, save, phase: 'over', gameResult: action.won, finalMode: false };
    }

    case 'RESET_SAVE':
      return { ...state, save: { ...FRESH_SAVE } };

    case 'LOAD_META': {
      const runStats = MetaStorage.loadRunStats();
      const aggregate = MetaStorage.loadAggregate();
      const achievementStates = MetaStorage.loadAchievements();
      return { ...state, runStats, aggregate, achievementStates };
    }

    case 'RECORD_RUN_END': {
      if (!state.run) return state;
      const result = action.won ? 'victory' as const : 'defeat' as const;
      const boneEarned = calcBoneReward(state.run, action.won);
      const rs = calcRunStats(state.run, result, boneEarned);

      /* 累計統計の更新 */
      const treeRate = TREE_DATA.length > 0
        ? Object.keys(state.save.tree).length / TREE_DATA.length
        : 0;
      const newAgg = { ...updateAggregate(state.aggregate, rs, state.run), treeCompletionRate: treeRate };

      /* 実績チェック */
      const { nextStates, newIds } = checkAllAchievements(state.achievementStates, rs, newAgg);

      const newRunStats = [...state.runStats, rs];
      const save = { ...state.save, bones: state.save.bones + boneEarned };

      return {
        ...state,
        save,
        runStats: newRunStats,
        aggregate: newAgg,
        achievementStates: nextStates,
        newAchievements: newIds,
      };
    }

    case 'REVIVE_ALLY': {
      if (!state.run) return state;
      const dead = deadAllies(state.run.al);
      const target = dead[action.allyIndex];
      if (!target) return state;
      const cost = action.pct === 100
        ? Math.floor(allyReviveCost(state.run) * FULL_REVIVE_COST_MULTIPLIER)
        : allyReviveCost(state.run);
      if (state.run.bE < cost) return state;
      const nextAl = state.run.al.map(a => {
        if (a === target) return { ...a, a: 1, hp: Math.floor(a.mhp * (action.pct / 100)) };
        return { ...a };
      });
      const nextRun = { ...state.run, al: nextAl, bE: state.run.bE - cost };
      const stillDead = deadAllies(nextRun.al);
      if (stillDead.length === 0) {
        return transitionAfterBiome(state, nextRun);
      }
      return { ...state, run: nextRun, reviveTargets: stillDead };
    }

    case 'SKIP_REVIVE': {
      if (!state.run) return state;
      return transitionAfterBiome(state, state.run);
    }

    case 'ENDLESS_CONTINUE': {
      if (!state.run) return state;
      // リループ処理: endlessWave +1、バイオームリセット
      const loopedRun = applyEndlessLoop(state.run);
      const nextRun = applyFirstBiome(loopedRun);
      return transitionToEvoPicks(state, nextRun);
    }

    case 'ENDLESS_RETIRE': {
      if (!state.run) return state;
      // ペナルティなしで終了（SURRENDER と異なり骨削減なし）
      const boneReward = calcBoneReward(state.run, false);
      const save = { ...state.save, bones: state.save.bones + boneReward };
      return { ...state, save, phase: 'over', gameResult: false, finalMode: false };
    }

    default:
      return state;
  }
}
