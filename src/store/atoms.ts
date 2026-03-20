/**
 * Jotai atoms — 後方互換の再エクスポート
 *
 * 全アトムは presentation/store/ に移動済み。
 * 既存コードの互換性のため再エクスポートする。
 */

// 型の再エクスポート（後方互換性のため）
export type { PuzzlePiece, ImageSize } from '../types/puzzle';

// ゲーム進行状態
export {
  selectedImageUrlAtom as imageUrlAtom,
  selectedImageSizeAtom as originalImageSizeAtom,
  puzzleStartTimeAtom,
  gameElapsedTimeAtom as puzzleElapsedTimeAtom,
  gameScoreAtom,
  isBestScoreAtom,
} from '../presentation/store/game-atoms';

// UI 状態
export {
  hintModeEnabledAtom,
  completionOverlayVisibleAtom,
  videoPlaybackEnabledAtom,
  videoUrlAtom,
  hintUsedAtom,
} from '../presentation/store/ui-atoms';

// パズルボード状態 — 旧 usePuzzle.ts 専用
// 注意: 以下の atom は旧 usePuzzle.ts でのみ使用される。
// 新コード（usePuzzleGame.ts）は puzzleBoardStateAtom を使うため、
// 旧コードと新コードで状態は同期しない（意図的な分離）。
// PuzzlePage.tsx を useGameFlow に移行後に削除可能。
import { atom } from 'jotai';
import { GridPosition } from '../types/geometry';
import type { PuzzlePiece } from '../types/puzzle';

/** パズルの分割数 */
export const puzzleDivisionAtom = atom<number>(4);

/** パズルのピース配列 */
export const puzzlePiecesAtom = atom<PuzzlePiece[]>([]);

/** 空白ピースの位置 */
export const emptyPiecePositionAtom = atom<GridPosition | null>(null);

/** パズルが完成したかどうか */
export const puzzleCompletedAtom = atom<boolean>(false);

/** 現在の手数 */
export const moveCountAtom = atom<number>(0);

/** シャッフル時の手数 */
export const shuffleMovesAtom = atom<number>(0);

/** 正解位置にあるピースの割合 */
export const correctRateAtom = atom<number>(0);
