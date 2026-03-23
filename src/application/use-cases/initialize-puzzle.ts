/**
 * パズル初期化ユースケース
 *
 * パズルの生成 → シャッフル → 初期状態の返却を行う。
 */
import { createPuzzleBoard, PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';
import { shufflePuzzle } from '../../domain/puzzle/services/shuffle-service';
import { calculateShuffleMoves } from '../../domain/puzzle/value-objects/division';

/** シャッフル後に完成状態だった場合の最大再試行回数 */
const MAX_RESHUFFLE_ATTEMPTS = 10;

/**
 * パズルを初期化する
 *
 * シャッフル後に偶然完成状態になった場合は再シャッフルする。
 *
 * @param division 分割数
 * @param shuffleMovesOverride シャッフル回数の上書き（テスト用）
 * @returns シャッフル済みのパズルボード状態（必ず未完成）
 */
export const initializePuzzle = (
  division: number,
  shuffleMovesOverride?: number
): PuzzleBoardState => {
  const board = createPuzzleBoard(division);
  const moves = shuffleMovesOverride ?? calculateShuffleMoves(division);

  for (let attempt = 0; attempt <= MAX_RESHUFFLE_ATTEMPTS; attempt++) {
    // 最終試行ではシャッフル回数を倍にして完成状態を回避
    const shuffleMoves = attempt < MAX_RESHUFFLE_ATTEMPTS ? moves : moves * 2;
    const shuffled = shufflePuzzle(board, shuffleMoves);
    if (!shuffled.isCompleted) {
      return shuffled;
    }
  }

  // 理論上到達不可能だが型安全のため
  return shufflePuzzle(board, moves * 2);
};
