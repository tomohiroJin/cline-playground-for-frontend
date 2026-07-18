/**
 * 灰燼の城壁 - ユースケース: ウェーブ開始と結果適用
 *
 * startWave: シミュレーションを実行し combat フェーズへ（UI が tick を再生）
 * finishWave: 再生完了後に結果をラン状態へ適用する
 */
import type { RandomPort } from '../ports/random-port';
import { simulateWave, NO_MODIFIERS } from '../../domain/combat/simulate-wave';
import { PLAINS_WAVES } from '../../domain/combat/waves';
import { generateRewardChoices } from '../../domain/run/reward';
import {
  LIFE_BONUS,
  WAVE_CLEAR_BONUS,
  type RunState,
} from '../../domain/run/run-state';

export const startWave = (state: RunState): RunState => {
  if (state.phase !== 'preparation') {
    throw new Error('準備フェーズ以外からウェーブは開始できません');
  }
  const wave = PLAINS_WAVES[state.waveIndex];
  if (!wave) {
    throw new Error(`ウェーブ定義が存在しません: ${state.waveIndex}`);
  }
  const result = simulateWave(state.board, wave, state.pendingModifiers);
  return { ...state, phase: 'combat', lastResult: result };
};

export const finishWave = (state: RunState, rng: RandomPort): RunState => {
  if (state.phase !== 'combat' || !state.lastResult) {
    throw new Error('戦闘フェーズ以外では結果を適用できません');
  }
  const result = state.lastResult;
  const life = Math.max(0, state.life - result.leaked);

  // 罠の使用回数を反映し、使い切った罠は盤面から除去
  const traps = state.board.traps
    .map((t, i) => ({ ...t, usesLeft: result.trapUsesLeft[i] ?? t.usesLeft }))
    .filter((t) => t.usesLeft > 0);
  const board = { ...state.board, traps };
  const baseScore = state.score + result.rewardScore;

  if (life <= 0) {
    return { ...state, board, life: 0, score: baseScore, phase: 'result', status: 'lost' };
  }

  const score = baseScore + WAVE_CLEAR_BONUS;
  const isLastWave = state.waveIndex + 1 >= PLAINS_WAVES.length;
  if (isLastWave) {
    return {
      ...state,
      board,
      life,
      score: score + life * LIFE_BONUS,
      phase: 'result',
      status: 'won',
    };
  }

  const random = () => rng.random();
  return {
    ...state,
    board,
    life,
    score,
    phase: 'reward',
    waveIndex: state.waveIndex + 1,
    rewardChoices: generateRewardChoices(random),
    pendingModifiers: { ...NO_MODIFIERS },
  };
};
