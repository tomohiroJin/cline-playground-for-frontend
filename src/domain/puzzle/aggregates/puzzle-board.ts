/**
 * PuzzleBoard 集約
 *
 * パズルの状態遷移を管理する集約ルート。
 * 全て純粋関数で構成され、副作用を持たない。
 */
import { assert } from '../../../shared/utils/assert';
import { GridPosition } from '../../../types/geometry';
import { PuzzlePiece } from '../../../types/puzzle';
import { createPuzzlePiece, isInCorrectPosition, movePieceTo } from '../entities/puzzle-piece';
import { isAdjacent } from '../value-objects/grid-position';

/** パズルボードの状態（不変） */
export interface PuzzleBoardState {
  readonly pieces: readonly PuzzlePiece[];
  readonly emptyPosition: GridPosition;
  readonly division: number;
  readonly moveCount: number;
  readonly isCompleted: boolean;
}

/**
 * パズルボードを生成する
 *
 * @param division 分割数
 * @returns 初期状態のパズルボード（全ピースが正解位置）
 */
export const createPuzzleBoard = (division: number): PuzzleBoardState => {
  assert(division > 0, 'division must be greater than 0');

  const pieces: PuzzlePiece[] = [];
  const emptyRow = division - 1;
  const emptyCol = division - 1;

  for (let row = 0; row < division; row++) {
    for (let col = 0; col < division; col++) {
      const isEmpty = row === emptyRow && col === emptyCol;
      const id = row * division + col;
      pieces.push(createPuzzlePiece(id, { row, col }, isEmpty));
    }
  }

  return {
    pieces,
    emptyPosition: { row: emptyRow, col: emptyCol },
    division,
    moveCount: 0,
    isCompleted: true,
  };
};

/**
 * ピースを移動する（DbC: 事前条件＋事後条件付き）
 *
 * @param state 現在のボード状態
 * @param pieceId 移動するピースのID
 * @returns 新しいボード状態
 */
export const movePiece = (state: PuzzleBoardState, pieceId: number): PuzzleBoardState => {
  // 事前条件
  assert(!state.isCompleted, 'Cannot move piece after completion');

  const pieceIndex = state.pieces.findIndex(p => p.id === pieceId);
  assert(pieceIndex !== -1, `Piece not found: ${pieceId}`);

  const piece = state.pieces[pieceIndex];
  assert(!piece.isEmpty, 'Cannot move empty piece');
  assert(
    isAdjacent(piece.currentPosition, state.emptyPosition),
    'Piece is not adjacent to empty position'
  );

  // ビジネスロジック: ピースと空白を入れ替える
  const newPieces = state.pieces.map((p, i) => {
    if (i === pieceIndex) return movePieceTo(p, state.emptyPosition);
    if (p.isEmpty) return movePieceTo(p, piece.currentPosition);
    return p;
  });

  const completed = newPieces.every(p => p.isEmpty || isInCorrectPosition(p));

  // 事後条件
  assert(newPieces.length === state.pieces.length, 'Piece count must not change');

  return {
    ...state,
    pieces: newPieces,
    emptyPosition: piece.currentPosition,
    moveCount: state.moveCount + 1,
    isCompleted: completed,
  };
};

/**
 * パズルが完成しているか判定する
 */
export const isCompleted = (state: PuzzleBoardState): boolean =>
  state.pieces.every(p => p.isEmpty || isInCorrectPosition(p));

/**
 * 正解率を計算する（0〜100）
 */
export const calculateCorrectRate = (state: PuzzleBoardState): number => {
  const nonEmptyPieces = state.pieces.filter(p => !p.isEmpty);
  if (nonEmptyPieces.length === 0) return 0;

  const correctCount = nonEmptyPieces.filter(isInCorrectPosition).length;
  return Math.round((correctCount / nonEmptyPieces.length) * 100);
};
