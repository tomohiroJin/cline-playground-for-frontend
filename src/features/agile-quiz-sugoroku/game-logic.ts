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
import { CONFIG, EVENTS, EMERGENCY_EVENT, DEBT_EVENTS, getDebtPoints } from './constants';
import { QUESTIONS } from './quiz-data';

// 共通数学関数を re-export
export { shuffle, clamp } from '../../utils/math-utils';

/** 平均値を計算 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** パーセンテージを計算 */
export function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** 問題を選択 */
export function pickQuestion(
  eventId: string,
  usedIndices?: Set<number>
): { question: Question; index: number } {
  const questions = QUESTIONS[eventId] ?? QUESTIONS.planning;
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

/** スプリント集計を生成 */
export function createSprintSummary(
  answers: AnswerResult[],
  sprintNumber: number,
  debt: number
): SprintSummary {
  let correctCount = 0;
  answers.forEach((a) => {
    if (a.c) correctCount++;
  });

  // カテゴリ別統計
  const cats: CategoryStats = {};
  answers.forEach((a) => {
    if (!cats[a.e]) {
      cats[a.e] = { c: 0, t: 0 };
    }
    cats[a.e].t++;
    if (a.c) cats[a.e].c++;
  });

  return {
    sp: sprintNumber + 1,
    pct: percentage(correctCount, answers.length),
    cor: correctCount,
    tot: answers.length,
    spd: average(answers.map((a) => a.s)),
    debt,
    em: answers.some((a) => a.e === 'emergency'),
    emOk: answers.filter((a) => a.e === 'emergency' && a.c).length,
    cats,
  };
}
