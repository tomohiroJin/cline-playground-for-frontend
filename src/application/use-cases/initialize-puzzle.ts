/**
 * パズル初期化ユースケース
 *
 * パズルの生成 → シャッフル → 初期状態の返却を行う。
 */
import { createPuzzleBoard, PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';
import { shufflePuzzle } from '../../domain/puzzle/services/shuffle-service';
import { calculateShuffleMoves } from '../../domain/puzzle/value-objects/division';

/**
 * パズルを初期化する
 *
 * @param division 分割数
 * @param shuffleMovesOverride シャッフル回数の上書き（テスト用）
 * @returns シャッフル済みのパズルボード状態
 */
export const initializePuzzle = (
  division: number,
  shuffleMovesOverride?: number
): PuzzleBoardState => {
  const board = createPuzzleBoard(division);
  const moves = shuffleMovesOverride ?? calculateShuffleMoves(division);
  return shufflePuzzle(board, moves);
};
