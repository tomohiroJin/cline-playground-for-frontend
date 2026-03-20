/**
 * シャッフルサービス
 *
 * パズルボードのピースをランダムにシャッフルする。
 * スライドパズルの制約に従い、合法手のみで移動する。
 */
import { assert } from '../../../shared/utils/assert';
import { PuzzleBoardState } from '../aggregates/puzzle-board';
import { movePieceTo, isInCorrectPosition } from '../entities/puzzle-piece';
import { getAdjacentPositions } from '../value-objects/grid-position';

/**
 * パズルボードをシャッフルする
 *
 * @param board 初期状態のボード
 * @param moves シャッフルの移動回数
 * @returns シャッフル済みのボード状態
 */
export const shufflePuzzle = (board: PuzzleBoardState, moves: number): PuzzleBoardState => {
  assert(board.pieces.length > 0, 'pieces array must not be empty');
  assert(board.division > 0, 'division must be greater than 0');

  let pieces = [...board.pieces];
  let emptyPos = { ...board.emptyPosition };

  for (let i = 0; i < moves; i++) {
    const adjacents = getAdjacentPositions(emptyPos, board.division);

    // 隣接位置のピースをランダムに選択して移動
    const pieceIndexMap = new Map(
      pieces.map((piece, index) => [
        `${piece.currentPosition.row},${piece.currentPosition.col}`,
        index,
      ])
    );

    // 隣接ピースをランダムに選択（最大試行回数付きで無限ループを防止）
    const MAX_ATTEMPTS = adjacents.length * 2;
    let moved = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !moved; attempt++) {
      const randomIdx = Math.floor(Math.random() * adjacents.length);
      const selectedPos = adjacents[randomIdx];
      const selectedPieceIdx = pieceIndexMap.get(`${selectedPos.row},${selectedPos.col}`);

      if (selectedPieceIdx !== undefined) {
        const selectedPiece = pieces[selectedPieceIdx];
        pieces = pieces.map((p, idx) => {
          if (idx === selectedPieceIdx) return movePieceTo(p, emptyPos);
          if (p.isEmpty) return movePieceTo(p, selectedPiece.currentPosition);
          return p;
        });
        emptyPos = { ...selectedPiece.currentPosition };
        moved = true;
      }
    }
  }

  // シャッフル結果の完成判定（moves が少ない場合に完成状態に戻る可能性がある）
  const completed = pieces.every(p => p.isEmpty || isInCorrectPosition(p));

  return {
    ...board,
    pieces,
    emptyPosition: emptyPos,
    moveCount: 0,
    isCompleted: completed,
  };
};
