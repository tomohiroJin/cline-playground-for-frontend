import { atom } from 'jotai';

// アップロードされた画像のURL
export const imageUrlAtom = atom<string | null>(null);

// 元の画像のサイズ
export const originalImageSizeAtom = atom<{
  width: number;
  height: number;
} | null>(null);

// パズルの分割数
export const puzzleDivisionAtom = atom<number>(4); // デフォルトは4x4=16ピース

// パズルのピース情報
export interface PuzzlePiece {
  id: number; // 0は空白を表す
  correctPosition: { row: number; col: number }; // 正しい位置
  currentPosition: { row: number; col: number }; // 現在の位置
  isEmpty: boolean; // 空白ピースかどうか
}

// パズルのピース配列
export const puzzlePiecesAtom = atom<PuzzlePiece[]>([]);

// 空白ピースの位置
export const emptyPiecePositionAtom = atom<{ row: number; col: number } | null>(null);

// パズルの開始時間
export const puzzleStartTimeAtom = atom<number | null>(null);

// パズルの経過時間（秒）
export const puzzleElapsedTimeAtom = atom<number>(0);

// パズルが完成したかどうか
export const puzzleCompletedAtom = atom<boolean>(false);

// ヒントモードが有効かどうか
export const hintModeEnabledAtom = atom<boolean>(false);

// 完成オーバーレイの表示状態
export const completionOverlayVisibleAtom = atom<boolean>(true);
