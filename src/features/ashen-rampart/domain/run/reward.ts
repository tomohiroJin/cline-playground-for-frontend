/**
 * 灰燼の城壁 - 報酬候補生成
 */
import type { RandomFn } from '../shared/random';
import { REWARD_POOL } from '../cards/card-pool';

/** 報酬プールから重複なしで count 枚のカードIDを選ぶ */
export const generateRewardChoices = (
  random: RandomFn,
  count = 3
): string[] => {
  const pool = [...REWARD_POOL];
  const choices: string[] = [];
  while (choices.length < count && pool.length > 0) {
    const i = Math.floor(random() * pool.length);
    choices.push(pool.splice(i, 1)[0]);
  }
  return choices;
};
