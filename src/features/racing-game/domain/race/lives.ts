// キャンペーン残機（純粋関数）

/** キャンペーン突入時の残機数 */
export const INITIAL_LIVES = 3;

/** 残機を 1 減らす（下限 0） */
export const decrementLives = (lives: number): number => Math.max(0, lives - 1);

/** ゲームオーバー（残機 0 以下）判定 */
export const isGameOver = (lives: number): boolean => lives <= 0;
