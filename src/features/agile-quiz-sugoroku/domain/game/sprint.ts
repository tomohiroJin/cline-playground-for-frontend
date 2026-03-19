/**
 * スプリント集計（純粋関数）
 *
 * 旧 game-logic.ts の createSprintSummary をそのまま移動。
 */
import {
  AnswerResult,
  SprintSummary,
  CategoryStats,
} from '../types';
import { average, percentage } from '../../../../utils/math-utils';

/** スプリント集計を生成（宣言的スタイル） */
export function createSprintSummary(
  answers: AnswerResult[],
  sprintNumber: number,
  debt: number,
): SprintSummary {
  const correctCount = answers.filter((a) => a.correct).length;

  const categoryStats = answers.reduce<CategoryStats>((acc, a) => ({
    ...acc,
    [a.eventId]: {
      correct: (acc[a.eventId]?.correct ?? 0) + (a.correct ? 1 : 0),
      total: (acc[a.eventId]?.total ?? 0) + 1,
    },
  }), {});

  return {
    sprintNumber: sprintNumber + 1,
    correctRate: percentage(correctCount, answers.length),
    correctCount,
    totalCount: answers.length,
    averageSpeed: average(answers.map((a) => a.speed)),
    debt,
    hadEmergency: answers.some((a) => a.eventId === 'emergency'),
    emergencySuccessCount: answers.filter((a) => a.eventId === 'emergency' && a.correct).length,
    categoryStats,
  };
}
