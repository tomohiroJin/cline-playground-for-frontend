import { movePieceUseCase } from './move-piece';
import { createPuzzleBoard, PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';
import { shufflePuzzle } from '../../domain/puzzle/services/shuffle-service';

describe('movePiece ユースケース', () => {
  let board: PuzzleBoardState;

  beforeEach(() => {
    // シャッフル済みの2×2ボードを準備
    const initial = createPuzzleBoard(2);
    board = shufflePuzzle(initial, 5);
  });

  it('隣接ピースの移動で手数が増える', () => {
    // 空白に隣接するピースを探す
    const adjacentPiece = board.pieces.find(
      p =>
        !p.isEmpty &&
        (Math.abs(p.currentPosition.row - board.emptyPosition.row) +
          Math.abs(p.currentPosition.col - board.emptyPosition.col)) === 1
    );

    if (!adjacentPiece) throw new Error('隣接ピースが見つかりません');

    const result = movePieceUseCase(board, adjacentPiece.id);
    expect(result.board.moveCount).toBe(1);
    expect(typeof result.isCompleted).toBe('boolean');
  });

  it('非隣接ピースの移動はエラーを返す', () => {
    // 空白に隣接しないピースを探す
    const nonAdjacentPiece = board.pieces.find(
      p =>
        !p.isEmpty &&
        (Math.abs(p.currentPosition.row - board.emptyPosition.row) +
          Math.abs(p.currentPosition.col - board.emptyPosition.col)) !== 1
    );

    // 2×2では全非空白ピースが隣接する可能性があるのでスキップ
    if (!nonAdjacentPiece) return;

    expect(() => movePieceUseCase(board, nonAdjacentPiece.id)).toThrow();
  });
});
