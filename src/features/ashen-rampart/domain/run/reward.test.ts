import { generateRewardChoices } from './reward';
import { REWARD_POOL } from '../cards/card-pool';
import { SeededRandom } from '../../infrastructure/random/seeded-random';

describe('generateRewardChoices', () => {
  const makeRandom = (seed: number) => {
    const rng = new SeededRandom(seed);
    return () => rng.random();
  };

  it('報酬プールから重複なしで3枚選ぶ', () => {
    const choices = generateRewardChoices(makeRandom(1));
    expect(choices).toHaveLength(3);
    expect(new Set(choices).size).toBe(3);
    for (const id of choices) {
      expect(REWARD_POOL).toContain(id);
    }
  });

  it('同じシードなら同じ選択肢になる（決定性）', () => {
    expect(generateRewardChoices(makeRandom(5))).toEqual(
      generateRewardChoices(makeRandom(5))
    );
  });
});
