/**
 * 原始進化録 - PRIMAL PATH - 戦闘アクション Reducer
 */
import type { GameState } from '../../types';
import type { BattleAction } from '../actions';
import {
  afterBattle, rollEvent, applySkill,
  calcBoneReward, handleFinalBossKill,
  deadAllies,
} from '../../game-logic';
import { transitionAfterBiome, transitionToEvoPicks } from '../reducer-helpers';

export function battleReducer(state: GameState, action: BattleAction): GameState {
  switch (action.type) {
    case 'BATTLE_TICK':
      return { ...state, run: action.nextRun };

    case 'AFTER_BATTLE': {
      if (!state.run || state.phase !== 'battle') return state;
      const { nextRun, biomeCleared } = afterBattle(state.run);
      if (biomeCleared) {
        const dead = deadAllies(nextRun.al);
        if (dead.length > 0) {
          return { ...state, run: nextRun, phase: 'ally_revive', reviveTargets: dead };
        }
        return transitionAfterBiome(state, nextRun);
      }
      // ランダムイベント発生判定（非ボス戦後のみ）
      const evt = rollEvent(nextRun);
      if (evt) {
        return { ...state, run: nextRun, phase: 'event', currentEvent: evt };
      }
      return transitionToEvoPicks(state, nextRun);
    }

    case 'USE_SKILL': {
      if (!state.run || state.phase !== 'battle') return state;
      const { nextRun } = applySkill(state.run, action.sid);
      return { ...state, run: nextRun };
    }

    case 'CHANGE_SPEED':
      return { ...state, battleSpd: action.speed };

    case 'SURRENDER': {
      if (!state.run) return state;
      const next = { ...state.run, bE: Math.floor(state.run.bE / 2) };
      const boneReward = calcBoneReward(next, false);
      const save = { ...state.save, bones: state.save.bones + boneReward };
      return { ...state, save, run: next, phase: 'over', gameResult: false, finalMode: false };
    }

    case 'FINAL_BOSS_KILLED': {
      if (!state.run || state.phase !== 'battle') return state;
      const { nextRun, gameWon } = handleFinalBossKill(state.run);
      if (gameWon) {
        const boneReward = calcBoneReward(nextRun, true);
        const save = {
          ...state.save,
          bones: state.save.bones + boneReward,
          clears: state.save.clears + 1,
          best: { ...state.save.best, [nextRun.di]: 1 },
        };
        // 神話世界（di===3）クリアで周回カウントをインクリメント
        if (nextRun.di === 3) {
          save.loopCount = (state.save.loopCount ?? 0) + 1;
        }
        return { ...state, save, run: nextRun, phase: 'over', gameResult: true, finalMode: false };
      }
      // 連戦継続
      nextRun.log.push({ x: `⚡ 最終ボス連戦 ${nextRun._fPhase}/${nextRun.dd.bb}！`, c: 'gc' });
      return { ...state, run: nextRun, phase: 'battle' };
    }

    default:
      return state;
  }
}
