/**
 * 敵AIの乱数プロバイダ管理
 *
 * テスト時に setRandomProvider で決定的な乱数へ差し替えられる。
 * NOTE: モジュールレベルの可変状態は既知の負債（spec §6）。Phase A では現状維持。
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

let _random: RandomProvider = defaultRandom;

/** 現在の乱数プロバイダーを取得する（モジュール間共有用） */
export const getRandom = (): RandomProvider => _random;

/** 乱数プロバイダーを設定する（テスト用） */
export function setRandomProvider(random: RandomProvider): void {
  _random = random;
}

/** 乱数プロバイダーをデフォルトにリセットする */
export function resetRandomProvider(): void {
  _random = defaultRandom;
}
