/**
 * プレイヤー残像トレイルサービス
 * 高速移動時の視覚的残像エフェクトを管理する純粋関数群。
 * React/DOM への依存なし。
 */

/** 残像サンプルの1フレーム分データ */
export type TrailSample = {
  readonly x: number;
  /** 画面座標（camY 補正済みの想定） */
  readonly y: number;
  readonly opacity: number;
};

/** 1フレームごとの opacity 減衰率 */
const OPACITY_DECAY = 0.15;
/** 先頭（新規）サンプルの初期 opacity */
const INITIAL_OPACITY = 1.0;

/**
 * 現在のプレイヤー画面位置を先頭に追加し、既存を1段フェード、maxLen 超過を除去する。
 *
 * @param existing - 現在の残像サンプル配列（変更されない）
 * @param x - プレイヤーの現在 X 座標
 * @param y - プレイヤーの現在 Y 座標（camY 補正済み）
 * @param maxLen - 保持する最大サンプル数
 * @returns 更新後の新しいサンプル配列
 */
export const sampleTrail = (
  existing: readonly TrailSample[],
  x: number,
  y: number,
  maxLen: number,
): TrailSample[] => {
  if (maxLen <= 0) {
    return [];
  }

  // 既存サンプルの opacity を1段階減衰させる
  const faded = existing.map((sample) => ({
    ...sample,
    opacity: Math.max(0, sample.opacity - OPACITY_DECAY),
  }));

  // 新規サンプルを先頭に追加し、maxLen 超過分を末尾から切り捨て
  const updated = [{ x, y, opacity: INITIAL_OPACITY }, ...faded];
  return updated.slice(0, maxLen);
};
