/**
 * Agile Quiz Sugoroku - デイリークイズ
 *
 * 日付をシードとしたランダム選出で毎日5問の日替わりクイズを提供する
 */
import { Question } from './types';
import { QUESTIONS } from './quiz-data';

// ── 型定義 ────────────────────────────────────────────────

/** デイリークイズの結果 */
export interface DailyResult {
  /** 日付キー（YYYY-MM-DD） */
  dateKey: string;
  /** 正解数 */
  correctCount: number;
  /** 出題数 */
  totalCount: number;
  /** タイムスタンプ */
  timestamp: number;
}

/** デイリークイズ日別保存データ */
interface DailyStorage {
  [dateKey: string]: DailyResult;
}

// ── 定数 ──────────────────────────────────────────────────

/** デイリークイズの出題数 */
const DAILY_QUESTION_COUNT = 5;

/** localStorage キー */
const STORAGE_KEY = 'aqs_daily';

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
  // シードが0の場合のフォールバック
  if (state === 0) state = 1;
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
};

// ── 問題選出 ──────────────────────────────────────────────

/**
 * 全カテゴリの問題をフラットにまとめる
 */
const getAllQuestions = (): Question[] => {
  return Object.values(QUESTIONS).flat();
};

/**
 * 日付に基づいて5問を選出する
 * 同じ日付では常に同じ問題セットが返される
 */
export const getDailyQuestions = (date: Date): Question[] => {
  const seed = dateSeed(date);
  const rng = seededRandom(seed);
  const all = getAllQuestions();

  // Fisher-Yates シャッフル（シード付き）
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, DAILY_QUESTION_COUNT);
};

// ── ストレージ ────────────────────────────────────────────

/**
 * デイリー結果の保存データを読み込む
 */
const loadStorage = (): DailyStorage => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DailyStorage;
  } catch {
    return {};
  }
};

/**
 * デイリー結果を保存する
 */
export const saveDailyResult = (result: DailyResult): void => {
  const storage = loadStorage();
  storage[result.dateKey] = result;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
};

/**
 * 指定日のデイリー結果を取得する
 */
export const getDailyResult = (dateKey: string): DailyResult | undefined => {
  const storage = loadStorage();
  return storage[dateKey];
};

// ── ストリーク計算 ────────────────────────────────────────

/**
 * 日付キーをフォーマットする（YYYY-MM-DD）
 */
export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 連続参加日数（ストリーク）を計算する
 */
export const getDailyStreak = (today: Date): number => {
  const storage = loadStorage();
  let streak = 0;
  const current = new Date(today);

  while (true) {
    const key = formatDateKey(current);
    if (storage[key]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};
