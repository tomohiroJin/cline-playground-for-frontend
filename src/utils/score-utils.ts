import {
  PuzzleScore,
  PuzzleRank,
  PuzzleRecord,
  DIVISION_MULTIPLIERS,
  RANK_THRESHOLDS,
  UnlockCondition,
  ThemeId,
} from '../types/puzzle';

/**
 * ランクを判定する
 *
 * @param score スコア
 * @returns ランク
 */
export const determineRank = (score: number): PuzzleRank => {
  if (score >= RANK_THRESHOLDS.THREE_STAR) return '★★★';
  if (score >= RANK_THRESHOLDS.TWO_STAR) return '★★☆';
  if (score >= RANK_THRESHOLDS.ONE_STAR) return '★☆☆';
  return 'クリア';
};

/**
 * スコアを計算する
 *
 * @param actualMoves 実際の手数
 * @param optimalMoves シャッフル手数（基準値）
 * @param elapsedSeconds 経過秒数
 * @param hintUsed ヒント使用有無
 * @param division 分割数
 * @returns PuzzleScore
 */
export const calculateScore = (
  actualMoves: number,
  optimalMoves: number,
  elapsedSeconds: number,
  hintUsed: boolean,
  division: number
): PuzzleScore => {
  const BASE_SCORE = 10_000;
  const MOVE_PENALTY_PER = 50;
  const TIME_PENALTY_PER = 10;
  const HINT_PENALTY = 1_000;

  const movePenalty = Math.max(0, actualMoves - optimalMoves) * MOVE_PENALTY_PER;
  const timePenalty = elapsedSeconds * TIME_PENALTY_PER;
  const hintPenalty = hintUsed ? HINT_PENALTY : 0;
  const multiplier = DIVISION_MULTIPLIERS[division] ?? 1.0;

  const rawScore = (BASE_SCORE - movePenalty - timePenalty - hintPenalty) * multiplier;
  const totalScore = Math.max(0, Math.round(rawScore));
  const rank = determineRank(totalScore);

  return {
    totalScore,
    moveCount: actualMoves,
    elapsedTime: elapsedSeconds,
    hintUsed,
    division,
    rank,
    shuffleMoves: optimalMoves,
  };
};

/**
 * テーマがアンロック済みかを判定する
 *
 * @param condition アンロック条件
 * @param totalClears 累計クリア回数
 * @param records パズル記録
 * @param themes テーマ定義一覧（themesClear 条件で必要）
 * @returns アンロック済みなら true
 */
export const isThemeUnlocked = (
  condition: UnlockCondition,
  totalClears: number,
  records: PuzzleRecord[],
  themeImageIds?: Map<ThemeId, string[]>
): boolean => {
  switch (condition.type) {
    case 'always':
      return true;
    case 'clearCount':
      return totalClears >= condition.count;
    case 'themesClear': {
      if (!themeImageIds) return false;
      return condition.themeIds.every(themeId => {
        const imageIds = themeImageIds.get(themeId);
        if (!imageIds || imageIds.length === 0) return false;
        return imageIds.some(imgId =>
          records.some(r => r.imageId === imgId && r.clearCount > 0)
        );
      });
    }
  }
};
