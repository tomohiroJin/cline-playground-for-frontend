/**
 * セーブデータの型定義
 */

/** セーブデータ */
export interface SaveData {
  bones: number;
  tree: Record<string, number>;
  clears: number;
  runs: number;
  best: Record<number, number>;
  /** 周回数（神話世界クリアごとに+1） */
  loopCount: number;
}
