// コンボ時の画面ティント強度を算出するドメインサービス。
// 純粋関数のみで構成し、外部依存（Config 等）を持たない。

/** ティント発動に必要な最小コンボ数 */
const MIN_COMBO_FOR_TINT = 2;

/**
 * combo あたりの強度係数。
 * combo=2 で約 0.1 から始まり、combo=12 で上限に達するよう調整。
 */
const INTENSITY_PER_COMBO = 0.1;

/** 強度の上限値 */
const MAX_INTENSITY = 1.0;

/**
 * コンボ数とコンボタイマー残量から画面ティント強度 0..1 を返す。
 *
 * - combo < MIN_COMBO_FOR_TINT または comboTimer <= 0 の場合は 0 を返す。
 * - combo が増えるほど強度が増加し、MAX_INTENSITY を超えない。
 * - 数値以外（NaN, Infinity など）は安全にハンドリングする。
 *
 * @param combo       現在のコンボ数
 * @param comboTimer  コンボ有効残りフレーム数
 * @returns           ティント強度 0..1
 */
export const comboTintIntensity = (combo: number, comboTimer: number): number => {
  // NaN / 無効値チェック: NaN は比較が常に false になるため `!isFinite` でも捕捉
  if (!Number.isFinite(combo) || !Number.isFinite(comboTimer)) {
    // Infinity の場合は combo だけ上限クリップを試みる
    if (Number.isFinite(comboTimer) && comboTimer > 0 && combo === Infinity) {
      return MAX_INTENSITY;
    }
    return 0;
  }

  // コンボタイマー切れ or 最小コンボ未満
  if (comboTimer <= 0 || combo < MIN_COMBO_FOR_TINT) {
    return 0;
  }

  // combo に比例した強度を計算し、上限でクリップ
  const raw = (combo - MIN_COMBO_FOR_TINT + 1) * INTENSITY_PER_COMBO;
  return Math.min(raw, MAX_INTENSITY);
};
