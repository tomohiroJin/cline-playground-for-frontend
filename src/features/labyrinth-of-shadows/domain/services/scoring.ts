/**
 * スコア計算サービス
 * 鍵取得・勝利・コンボに関するスコア計算の純粋関数群
 */
import { GAME_BALANCE } from '../constants';

const { KEY_BASE_SCORE, VICTORY_BONUS, COMBO_TIME_WINDOW } = GAME_BALANCE.scoring;

/** 鍵取得時のスコアを計算する */
export const calculateKeyScore = (combo: number): number => {
  return KEY_BASE_SCORE * combo;
};

/** 勝利時のボーナススコアを計算する */
export const calculateVictoryScore = (remainingTime: number): number => {
  return Math.floor(remainingTime / 100) + VICTORY_BONUS;
};

/** コンボ数を計算する（時間窓内の連続取得を判定） */
export const calculateCombo = (
  currentCombo: number,
  gameTime: number,
  lastKeyTime: number
): number => {
  if (gameTime - lastKeyTime < COMBO_TIME_WINDOW) {
    return currentCombo + 1;
  }
  return 1;
};
