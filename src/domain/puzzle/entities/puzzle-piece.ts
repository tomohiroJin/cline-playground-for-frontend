/**
 * PuzzlePiece エンティティ
 *
 * パズルの各ピースを表すエンティティ。
 * 不変更新パターンで状態を管理する。
 */
import { GridPosition } from '../../../types/geometry';
import { PuzzlePiece } from '../../../types/puzzle';

/**
 * ピースのファクトリ関数
 *
 * @param id ピースID
 * @param correctPosition 正解位置
 * @param isEmpty 空白ピースかどうか
 * @returns 新しいPuzzlePiece（初期状態では正解位置にある）
 */
export const createPuzzlePiece = (
  id: number,
  correctPosition: GridPosition,
  isEmpty: boolean
): PuzzlePiece => ({
  id,
  correctPosition: { ...correctPosition },
  currentPosition: { ...correctPosition },
  isEmpty,
});

/**
 * ピースが正解位置にあるか判定する
 */
export const isInCorrectPosition = (piece: PuzzlePiece): boolean =>
  piece.correctPosition.row === piece.currentPosition.row &&
  piece.correctPosition.col === piece.currentPosition.col;

/**
 * ピースを新しい位置に移動する（不変更新）
 */
export const movePieceTo = (piece: PuzzlePiece, position: GridPosition): PuzzlePiece => ({
  ...piece,
  currentPosition: { ...position },
});
