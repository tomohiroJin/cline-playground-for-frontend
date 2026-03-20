import { GridPosition } from './geometry';

/** ランク */
export type PuzzleRank = '★★★' | '★★☆' | '★☆☆' | 'クリア';

/** スコア計算結果 */
export interface PuzzleScore {
  totalScore: number;
  moveCount: number;
  elapsedTime: number;
  hintUsed: boolean;
  division: number;
  rank: PuzzleRank;
  shuffleMoves: number;
}

// 後方互換: RANK_THRESHOLDS は domain/scoring/score-calculator.ts に移動済み
export { RANK_THRESHOLDS } from '../domain/scoring/score-calculator';

/** 画像サイズ */
export type ImageSize = { width: number; height: number };

/** パズルのピース情報 */
export type PuzzlePiece = {
  readonly id: number;
  readonly correctPosition: GridPosition;
  readonly currentPosition: GridPosition;
  readonly isEmpty: boolean;
};

/** テーマ識別子 */
export type ThemeId =
  | 'illustration-gallery'
  | 'world-scenery'
  | 'nostalgia'
  | 'sea-and-sky'
  | 'four-seasons'
  | 'mystery';

/** アンロック条件 */
export type UnlockCondition =
  | { type: 'always' }
  | { type: 'clearCount'; count: number }
  | { type: 'themesClear'; themeIds: ThemeId[] };

/** パズル画像定義 */
export interface PuzzleImage {
  id: string;
  filename: string;
  alt: string;
  themeId: ThemeId;
  hasVideo: boolean;
}

/** テーマ定義 */
export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  unlockCondition: UnlockCondition;
  images: PuzzleImage[];
}

/** ベストスコア記録（画像×難易度ごと） */
export interface PuzzleRecord {
  imageId: string;
  division: number;
  bestScore: number;
  bestRank: PuzzleRank;
  bestTime: number;
  bestMoves: number | null;
  clearCount: number;
  lastClearDate: string;
}
