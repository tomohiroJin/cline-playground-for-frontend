/**
 * MIMIC ロジック（純粋関数）
 *
 * 洞窟ステージ pos 5 のミミック。
 * Z 連打で鍵を取得する。
 */

/** MIMIC 状態 */
export interface MimicState {
  readonly pryCount: number;
  readonly isOpen: boolean;
  readonly isKeyReady: boolean;
}

/** 鍵取得に必要な連打回数 */
const PRY_THRESHOLD = 5;

/** MIMIC の初期状態を生成 */
export function createMimicState(): MimicState {
  return { pryCount: 0, isOpen: false, isKeyReady: false };
}

/** Z 連打でカウント増加 */
export function pryMimic(state: MimicState): MimicState {
  const next = state.pryCount + 1;
  return {
    ...state,
    pryCount: next,
    isKeyReady: next >= PRY_THRESHOLD,
  };
}

/** pryCount の減衰（部屋不在時） */
export function decayPryCount(state: MimicState): MimicState {
  const next = Math.max(0, state.pryCount - 1);
  return {
    ...state,
    pryCount: next,
    isKeyReady: next >= PRY_THRESHOLD,
  };
}

/**
 * ミミックの開閉状態を更新（ビートサイクルベース）
 * @param beatCount ミミックのビートカウント
 * @param hazardPeriod ハザードサイクル周期
 * @returns true=開いている（危険）
 */
export function updateMimicOpen(beatCount: number, hazardPeriod: number): boolean {
  return (beatCount % hazardPeriod) >= (hazardPeriod - 2);
}

/** ミミックが危険状態か判定 */
export function isMimicDangerous(isOpen: boolean): boolean {
  return isOpen;
}
