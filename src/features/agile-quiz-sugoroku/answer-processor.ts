/**
 * 回答処理の純粋関数群
 *
 * useGame.ts の answer コールバックから抽出した状態非依存の計算ロジック。
 */
import { AnswerResult, GameStats } from './types';
import { DEBT_EVENTS, getDebtPoints } from './constants';

/** 回答計算の入力 */
export interface AnswerInput {
  optionIndex: number;
  correctAnswer: number;
  speed: number;
  eventId: string;
}

/** 回答結果を計算（純粋関数） */
export function computeAnswerResult(input: AnswerInput): AnswerResult {
  return {
    correct: input.optionIndex === input.correctAnswer,
    speed: input.speed,
    eventId: input.eventId,
  };
}

/** 負債増分を計算（純粋関数） */
export function computeDebtDelta(isCorrect: boolean, eventId: string): number {
  if (!isCorrect && DEBT_EVENTS[eventId]) {
    return getDebtPoints(eventId);
  }
  return 0;
}

/** 次のゲーム統計を計算（純粋関数） */
export function nextGameStats(
  prev: GameStats,
  result: AnswerResult,
  debtDelta: number
): GameStats {
  const newCombo = result.correct ? prev.combo + 1 : 0;
  return {
    totalCorrect: prev.totalCorrect + (result.correct ? 1 : 0),
    totalQuestions: prev.totalQuestions + 1,
    speeds: [...prev.speeds, result.speed],
    debt: prev.debt + debtDelta,
    emergencyCount: prev.emergencyCount + (result.eventId === 'emergency' ? 1 : 0),
    emergencySuccess: prev.emergencySuccess + (result.eventId === 'emergency' && result.correct ? 1 : 0),
    combo: newCombo,
    maxCombo: Math.max(prev.maxCombo, newCombo),
  };
}
