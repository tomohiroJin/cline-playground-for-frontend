/**
 * パズルリセットユースケース
 *
 * パズルを再生成・リシャッフルする。
 * 現時点では initializePuzzle と同一だが、将来的にリセット固有の処理
 * （リセット回数の統計記録、リセット時のペナルティ等）を追加する拡張点として維持する。
 */
import { PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';
import { initializePuzzle } from './initialize-puzzle';

/**
 * パズルをリセットする
 *
 * @param division 分割数
 * @param shuffleMovesOverride シャッフル回数の上書き（テスト用）
 * @returns リシャッフル済みのパズルボード状態
 */
export const resetPuzzleUseCase = (
  division: number,
  shuffleMovesOverride?: number
): PuzzleBoardState => initializePuzzle(division, shuffleMovesOverride);
