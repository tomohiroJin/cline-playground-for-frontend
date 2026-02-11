import { STAGE_ORDER } from '../constants';
import type { Stage, StageClearResult } from '../types';

export const nextStage = (stage: Stage): Stage | null => {
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0 || index === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[index + 1];
};

export const resolveEndingScene = (loop: number): 'ending1' | 'trueEnd' =>
  loop >= 3 ? 'trueEnd' : 'ending1';

export const resolveStageClear = (stage: Stage, loop: number): StageClearResult => {
  if (stage === 'boss') {
    if (loop >= 3) {
      return {
        nextScene: 'trueEnd',
        scoreBonus: 5000 * loop,
        hpBonus: 1,
      };
    }
    if (loop === 1) {
      return {
        nextScene: 'ending1',
        scoreBonus: 5000 * loop,
        hpBonus: 1,
      };
    }
    return {
      nextStage: 'cave',
      scoreBonus: 5000 * loop,
      hpBonus: 1,
    };
  }

  const next = nextStage(stage);
  if (next) {
    return {
      nextStage: next,
      scoreBonus: stage === 'cave' ? 2000 * loop : 3000 * loop,
      hpBonus: 1,
    };
  }
  return {
    nextScene: resolveEndingScene(loop),
    scoreBonus: 2000 * loop,
    hpBonus: 1,
  };
};
