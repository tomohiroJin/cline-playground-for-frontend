/** 鑑定メダルの種別 */
export type ChallengeMedal = 'gold' | 'silver' | 'bronze';

/** 制限時間 = 最適手数 × この秒数 */
export const MEDAL_TIME_SECONDS_PER_OPTIMAL_MOVE = 3;
/** 手数制限 = 最適手数 × この比率 */
export const MEDAL_MOVE_MARGIN_RATIO = 1.5;

/** 達成判定の入力 */
export interface ChallengeInput {
  readonly elapsedSeconds: number;
  readonly actualMoves: number;
  /** 最適手数 = division² × 2 */
  readonly optimalMoves: number;
}

/**
 * タイム＋手数の両条件から鑑定メダルを判定する純粋関数。
 * 両達成=gold / 片方達成=silver / クリアのみ=bronze。
 */
export const evaluateChallenge = (input: ChallengeInput): ChallengeMedal => {
  const timeLimit = input.optimalMoves * MEDAL_TIME_SECONDS_PER_OPTIMAL_MOVE;
  const moveLimit = Math.round(input.optimalMoves * MEDAL_MOVE_MARGIN_RATIO);
  const withinTime = input.elapsedSeconds <= timeLimit;
  const withinMove = input.actualMoves <= moveLimit;

  if (withinTime && withinMove) return 'gold';
  if (withinTime || withinMove) return 'silver';
  return 'bronze';
};
