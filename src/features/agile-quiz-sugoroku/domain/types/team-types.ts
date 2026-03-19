/**
 * チーム分類に関するドメイン型定義
 */

/** タイプ分類用統計 */
export interface ClassifyStats {
  stab: number;
  debt: number;
  emSuc: number;
  sc: number[];
  tp: number;
  spd: number;
}

/** チームタイプ */
export interface TeamType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  feedback: string;
  nextStep: string;
  condition: (stats: ClassifyStats) => boolean;
}
