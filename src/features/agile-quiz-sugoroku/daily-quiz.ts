/**
 * Agile Quiz Sugoroku - デイリークイズ
 *
 * 後方互換用の再エクスポート。
 * ストレージ処理は infrastructure/storage/daily-quiz-repository.ts に移行済み。
 * 問題選出ロジック（getDailyQuestions 等）は本ファイルに残留。
 */
import { Question } from './domain/types';
import { QUESTIONS } from './questions';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import {
  DailyQuizRepository,
  formatDateKey,
} from './infrastructure/storage/daily-quiz-repository';
import type { DailyResult } from './infrastructure/storage/daily-quiz-repository';

// 型の再エクスポート
export type { DailyResult };
export { formatDateKey };

const repository = new DailyQuizRepository(new LocalStorageAdapter());

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

// ── ストレージ（後方互換） ────────────────────────────────

/** デイリー結果を保存する */
export const saveDailyResult = (result: DailyResult): void => {
  repository.saveResult(result);
};

/** 指定日のデイリー結果を取得する */
export const getDailyResult = (dateKey: string): DailyResult | undefined => {
  return repository.getResult(dateKey);
};

/** 連続参加日数（ストリーク）を計算する */
export const getDailyStreak = (today: Date): number => {
  return repository.getStreak(today);
};
