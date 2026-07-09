/**
 * パズル初期化ユースケース
 *
 * パズルの生成 → シャッフル → 初期状態の返却を行う。
 */
import { createPuzzleBoard, PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';
import { shufflePuzzle } from '../../domain/puzzle/services/shuffle-service';
import { calculateShuffleMoves, createDivision } from '../../domain/puzzle/value-objects/division';
import { createSeededRng } from '../../domain/puzzle/value-objects/seed';

/** シャッフル後に完成状態だった場合の最大再試行回数 */
const MAX_RESHUFFLE_ATTEMPTS = 10;

/** パズル初期化オプション */
export interface InitializePuzzleOptions {
  /** 日付シード等。指定時は決定的シャッフル（同一シード→同一配置） */
  readonly seed?: number;
  /** シャッフル回数の上書き（テスト用） */
  readonly shuffleMovesOverride?: number;
}

/**
 * パズルを初期化する。
 *
 * シャッフル後に偶然完成状態になった場合は再シャッフルする。
 * seed 指定時は試行番号を加味した決定的 rng を使い、同一シードで必ず同一配置になる。
 *
 * @param division 分割数
 * @param options seed / shuffleMovesOverride
 * @returns シャッフル済みのパズルボード状態（必ず未完成）
 */
export const initializePuzzle = (
  division: number,
  options?: InitializePuzzleOptions
): PuzzleBoardState => {
  // 分割数を値オブジェクトのファクトリで検証し、有効な分割数のみ許可する
  const validDivision = createDivision(division);
  const board = createPuzzleBoard(validDivision);
  const moves = options?.shuffleMovesOverride ?? calculateShuffleMoves(validDivision);
  const seed = options?.seed;

  for (let attempt = 0; attempt <= MAX_RESHUFFLE_ATTEMPTS; attempt++) {
    // 最終試行ではシャッフル回数を倍にして完成状態を回避
    const shuffleMoves = attempt < MAX_RESHUFFLE_ATTEMPTS ? moves : moves * 2;
    // seed 指定時は試行ごとに決定的 rng を派生（再シャッフルも再現可能にする）
    const rng = seed !== undefined ? createSeededRng(seed + attempt) : Math.random;
    const shuffled = shufflePuzzle(board, shuffleMoves, rng);
    if (!shuffled.isCompleted) {
      return shuffled;
    }
  }

  // 理論上到達不可能だが型安全のため
  const finalRng = seed !== undefined ? createSeededRng(seed + MAX_RESHUFFLE_ATTEMPTS) : Math.random;
  return shufflePuzzle(board, moves * 2, finalRng);
};
