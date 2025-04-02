import { atom } from 'jotai';

/**
 * 共通のアトム作成ヘルパー関数
 *
 * @template T - アトムのデータ型
 * @param defaultValue - アトムの初期値
 * @returns アトム
 */
function createAtom<T>(defaultValue: T) {
  return atom<T>(defaultValue);
}

/**
 * 座標を表す型
 */
export type Position = { row: number; col: number };

// 初期値の定数
const DEFAULT_PUZZLE_DIVISION = 4;
const DEFAULT_PUZZLE_ELAPSED_TIME = 0;

/**
 * アップロードされた画像のURLを管理するアトム
 */
export const imageUrlAtom = createAtom<string | null>(null);

/**
 * 画像サイズを表す型
 *
 * - `width`: 画像の幅
 * - `height`: 画像の高さ
 */
export type ImageSize = { width: number; height: number };

/**
 * 元の画像のサイズを管理するアトム
 */
export const originalImageSizeAtom = createAtom<ImageSize | null>(null);

/**
 * パズルの分割数（デフォルトは4x4=16ピース）を管理するアトム
 */
export const puzzleDivisionAtom = createAtom<number>(DEFAULT_PUZZLE_DIVISION);

/**
 * パズルのピース情報を表す型
 *
 * - `id`: ピースの識別子（0は空白を表す）
 * - `correctPosition`: ピースの正しい位置
 * - `currentPosition`: ピースの現在の位置
 * - `isEmpty`: 空白ピースかどうか
 */
export type PuzzlePiece = {
  id: number;
  correctPosition: Position;
  currentPosition: Position;
  isEmpty: boolean;
};

/**
 * パズルのピース配列を管理するアトム
 */
export const puzzlePiecesAtom = createAtom<PuzzlePiece[]>([]);

/**
 * 空白ピースの位置を管理するアトム
 */
export const emptyPiecePositionAtom = createAtom<Position | null>(null);

/**
 * パズルの開始時間（タイムスタンプ）を管理するアトム
 */
export const puzzleStartTimeAtom = createAtom<number | null>(null);

/**
 * パズルの経過時間（秒）を管理するアトム
 */
export const puzzleElapsedTimeAtom = createAtom<number>(DEFAULT_PUZZLE_ELAPSED_TIME);

/**
 * パズルが完成したかどうかを管理するアトム
 */
export const puzzleCompletedAtom = createAtom<boolean>(false);

/**
 * ヒントモードが有効かどうかを管理するアトム
 */
export const hintModeEnabledAtom = createAtom<boolean>(false);

/**
 * 完成オーバーレイの表示状態を管理するアトム
 */
export const completionOverlayVisibleAtom = createAtom<boolean>(true);
