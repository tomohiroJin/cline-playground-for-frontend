import { atom } from 'jotai';
import { GridPosition } from '../types/geometry';

// 型の再エクスポート（後方互換性のため）
export type { PuzzlePiece, ImageSize } from '../types/puzzle';
import type { PuzzlePiece, ImageSize } from '../types/puzzle';

// 初期値の定数
const DEFAULT_PUZZLE_DIVISION = 4;
const DEFAULT_PUZZLE_ELAPSED_TIME = 0;

/**
 * アップロードされた画像のURLを管理するアトム
 */
export const imageUrlAtom = atom<string | null>(null);

/**
 * 元の画像のサイズを管理するアトム
 */
export const originalImageSizeAtom = atom<ImageSize | null>(null);

/**
 * パズルの分割数（デフォルトは4x4=16ピース）を管理するアトム
 */
export const puzzleDivisionAtom = atom<number>(DEFAULT_PUZZLE_DIVISION);

/**
 * パズルのピース配列を管理するアトム
 */
export const puzzlePiecesAtom = atom<PuzzlePiece[]>([]);

/**
 * 空白ピースの位置を管理するアトム
 */
export const emptyPiecePositionAtom = atom<GridPosition | null>(null);

/**
 * パズルの開始時間（タイムスタンプ）を管理するアトム
 */
export const puzzleStartTimeAtom = atom<number | null>(null);

/**
 * パズルの経過時間（秒）を管理するアトム
 */
export const puzzleElapsedTimeAtom = atom<number>(DEFAULT_PUZZLE_ELAPSED_TIME);

/**
 * パズルが完成したかどうかを管理するアトム
 */
export const puzzleCompletedAtom = atom<boolean>(false);

/**
 * ヒントモードが有効かどうかを管理するアトム
 */
export const hintModeEnabledAtom = atom<boolean>(false);

/**
 * 完成オーバーレイの表示状態を管理するアトム
 */
export const completionOverlayVisibleAtom = atom<boolean>(true);

/**
 * 動画再生モードの状態を管理するアトム
 */
export const videoPlaybackEnabledAtom = atom<boolean>(false);

/**
 * 再生する動画のURLを管理するアトム
 */
export const videoUrlAtom = atom<string | null>(null);

/**
 * 現在の手数を管理するアトム
 */
export const moveCountAtom = atom<number>(0);

/**
 * シャッフル時の手数（= optimalMoves 基準値）を管理するアトム
 */
export const shuffleMovesAtom = atom<number>(0);

/**
 * 正解位置にあるピースの割合（0〜100）を管理するアトム
 */
export const correctRateAtom = atom<number>(0);

/**
 * ヒント使用フラグを管理するアトム
 */
export const hintUsedAtom = atom<boolean>(false);
