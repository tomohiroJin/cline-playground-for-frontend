/**
 * ピース移動ユースケース
 *
 * ドメイン集約の movePiece を呼び出し、完成判定結果も返す。
 */
import { movePiece, PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';

/** ピース移動の結果 */
export interface MovePieceResult {
  readonly board: PuzzleBoardState;
  readonly isCompleted: boolean;
}

/**
 * ピースを移動する
 *
 * @param board 現在のボード状態
 * @param pieceId 移動するピースのID
 * @returns 移動後のボード状態と完成判定結果
 */
export const movePieceUseCase = (
  board: PuzzleBoardState,
  pieceId: number
): MovePieceResult => {
  const newBoard = movePiece(board, pieceId);
  return {
    board: newBoard,
    isCompleted: newBoard.isCompleted,
  };
};
