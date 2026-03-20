/**
 * パズル完成ユースケース
 *
 * スコア計算 → 記録保存 → ベスト判定 → クリア数インクリメントを行う。
 */
import { calculateScore } from '../../domain/scoring/score-calculator';
import { PuzzleScore } from '../../types/puzzle';
import { PuzzleRecordStorage, TotalClearsStorage } from '../ports/storage-port';

/** パズル完成ユースケースのゲームデータ入力 */
export interface CompletePuzzleGameData {
  readonly imageId: string;
  readonly actualMoves: number;
  readonly optimalMoves: number;
  readonly elapsedSeconds: number;
  readonly hintUsed: boolean;
  readonly division: number;
}

/** パズル完成ユースケースの結果 */
export interface CompletePuzzleResult {
  readonly score: PuzzleScore;
  readonly isBestScore: boolean;
}

/** 後方互換: 旧インターフェース（ストレージを入力に含む） */
export interface CompletePuzzleInput extends CompletePuzzleGameData {
  readonly recordStorage: PuzzleRecordStorage;
  readonly totalClearsStorage: TotalClearsStorage;
}

/**
 * パズル完成ユースケース（関数版 — 後方互換）
 */
export const completePuzzleUseCase = (input: CompletePuzzleInput): CompletePuzzleResult => {
  const useCase = new CompletePuzzle(input.recordStorage, input.totalClearsStorage);
  return useCase.execute(input);
};

/**
 * パズル完成ユースケース（クラス版 — コンストラクタインジェクション）
 *
 * ストレージ依存は生成時に注入し、execute は純粋なゲームデータのみ受け取る。
 */
export class CompletePuzzle {
  constructor(
    private readonly recordStorage: PuzzleRecordStorage,
    private readonly totalClearsStorage: TotalClearsStorage
  ) {}

  execute(data: CompletePuzzleGameData): CompletePuzzleResult {
    // スコア計算
    const score = calculateScore({
      actualMoves: data.actualMoves,
      optimalMoves: data.optimalMoves,
      elapsedSeconds: data.elapsedSeconds,
      hintUsed: data.hintUsed,
      division: data.division,
    });

    // 記録保存
    const { isBestScore } = this.recordStorage.recordScore(
      data.imageId,
      data.division,
      score.totalScore,
      score.rank,
      data.elapsedSeconds,
      data.actualMoves
    );

    // クリア数インクリメント
    this.totalClearsStorage.increment();

    return { score, isBestScore };
  }
}
