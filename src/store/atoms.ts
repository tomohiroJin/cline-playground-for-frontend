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

// パズルボード状態 — 旧フック互換
// 旧 usePuzzle.ts が個別 atom を使っているため、互換用に残す
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
