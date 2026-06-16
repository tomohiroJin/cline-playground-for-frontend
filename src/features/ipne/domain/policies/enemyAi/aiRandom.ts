/**
 * 敵AIの乱数プロバイダ
 *
 * Math.random ベースの不変プロバイダを提供する。
 */
import { RandomProvider } from '../../ports';

/** デフォルトの乱数プロバイダー（Math.random ベース） */
export const defaultRandom: RandomProvider = {
  random: () => Math.random(),
  randomInt: (min, max) => min + Math.floor(Math.random() * (max - min)),
  pick: (array) => array[Math.floor(Math.random() * array.length)],
  shuffle: (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
};
