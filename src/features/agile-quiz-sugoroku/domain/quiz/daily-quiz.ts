/**
 * Agile Quiz Sugoroku - デイリークイズ選出ロジック
 *
 * 日付シードに基づき決定論的に 5 問を選出する。
 * ストレージ処理は infrastructure/storage/daily-quiz-service.ts を参照。
 */
import { Question } from '../types';
import { QUESTIONS } from '../../data/questions';

// ── シード付きランダム ────────────────────────────────────

/**
 * 日付からシード値を生成する
 */
export const dateSeed = (date: Date): number => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
};

/**
 * シード付き疑似乱数生成器（xorshift32）
 */
export const seededRandom = (seed: number): (() => number) => {
  let state = seed | 0;
  if (state === 0) state = 1;
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
};

// ── 問題選出 ──────────────────────────────────────────────

/** 全カテゴリの問題をフラットにまとめる */
const getAllQuestions = (): Question[] => {
  return Object.values(QUESTIONS).flat();
};

/** 日付に基づいて5問を選出する */
export const getDailyQuestions = (date: Date): Question[] => {
  const seed = dateSeed(date);
  const rng = seededRandom(seed);
  const all = getAllQuestions();

  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 5);
};
