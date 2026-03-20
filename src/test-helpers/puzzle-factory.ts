/**
 * テスト用ファクトリ関数
 *
 * ドメインオブジェクトのテストデータ生成を共通化する。
 */
import { PuzzlePiece } from '../types/puzzle';
import { createPuzzleBoard, PuzzleBoardState } from '../domain/puzzle/aggregates/puzzle-board';
import { shufflePuzzle } from '../domain/puzzle/services/shuffle-service';

/** テスト用ピースを生成する */
export const createTestPiece = (overrides?: Partial<PuzzlePiece>): PuzzlePiece => ({
  id: 0,
  correctPosition: { row: 0, col: 0 },
  currentPosition: { row: 0, col: 0 },
  isEmpty: false,
  ...overrides,
});

/** テスト用ボード（シャッフル済み・未完成状態）を生成する */
export const createTestBoard = (division: number): PuzzleBoardState => {
  const board = createPuzzleBoard(division);
  return shufflePuzzle(board, division * division);
};

/** 完成状態のボード（全ピースが正解位置）を生成する */
export const createCompletedBoard = (division: number): PuzzleBoardState =>
  createPuzzleBoard(division);
