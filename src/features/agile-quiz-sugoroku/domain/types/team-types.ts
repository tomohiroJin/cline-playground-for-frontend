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

/** エンジニアタイプ（後方互換性のため残存） */
export interface EngineerType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  condition: (stats: ClassifyStats) => boolean;
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
