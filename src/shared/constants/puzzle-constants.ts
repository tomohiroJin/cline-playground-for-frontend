/**
 * パズルゲーム共有定数
 */

/** ボードの最大幅（px） */
export const MAX_BOARD_WIDTH = 600;

/** デフォルトの分割数 */
export const DEFAULT_DIVISION = 4;

/** 有効な分割数の一覧 */
export const VALID_DIVISIONS = [2, 3, 4, 5, 6, 8, 10, 16, 32] as const;

/** ピース消失アニメーションの時間（秒） */
export const DISSOLVE_DURATION = 1.0;

/** シャッフル係数（division² × この値 = シャッフル回数） */
export const SHUFFLE_FACTOR = 2;
