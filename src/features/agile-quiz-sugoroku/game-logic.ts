/**
 * Agile Quiz Sugoroku - ゲームロジック（純粋関数）
 *
 * useGame.ts から抽出した状態非依存のユーティリティ関数群。
 * テスト容易性と再利用性のために分離。
 */
import {
  GameEvent,
  Question,
  AnswerResult,
  SprintSummary,
  CategoryStats,
} from './types';
import { CONFIG, EVENTS, EMERGENCY_EVENT } from './constants';

// 共通数学関数を re-export
export { shuffle, clamp, average, percentage } from '../../utils/math-utils';
import { average, percentage } from '../../utils/math-utils';

/** 問題を選択（純粋関数 - 問題配列を引数で受け取る） */
export function pickQuestion(
  questions: Question[],
  usedIndices?: Set<number>
): { question: Question; index: number } {
  const used = usedIndices ?? new Set<number>();

  // 未使用の問題インデックスを取得
  const available: number[] = [];
  for (let i = 0; i < questions.length; i++) {
    if (!used.has(i)) {
      available.push(i);
    }
  }

  // 未使用があればそこから、なければランダム
  const index =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : Math.floor(Math.random() * questions.length);

  return { question: questions[index], index };
}

/** スプリントイベントを生成（緊急対応の発生判定含む） */
export function makeEvents(sprintNumber: number, debt: number): GameEvent[] {
  const events = [...EVENTS];

  // 2スプリント目以降で緊急対応が発生する可能性
  if (sprintNumber > 0) {
    const probability = Math.min(
      CONFIG.emergency.maxProbability,
      CONFIG.emergency.base + debt * CONFIG.emergency.debtMultiplier
    );

    if (Math.random() < probability) {
      // ランダムな位置（1〜4）に緊急対応を挿入
      const position =
        CONFIG.emergency.minPosition +
        Math.floor(
          Math.random() *
            (CONFIG.emergency.maxPosition - CONFIG.emergency.minPosition)
        );
      events[position] = { ...EMERGENCY_EVENT };
    }
  }

  return events;
}

/** スプリント集計を生成（宣言的スタイル） */
export function createSprintSummary(
  answers: AnswerResult[],
  sprintNumber: number,
  debt: number
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
