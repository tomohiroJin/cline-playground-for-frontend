/**
 * Agile Quiz Sugoroku - デイリークイズストレージサービス
 *
 * DailyQuizRepository のシングルトンに委譲する薄いラッパー。
 * 問題選出ロジックは domain/quiz/daily-quiz.ts を参照。
 */
import { LocalStorageAdapter } from './local-storage-adapter';
import { DailyQuizRepository, formatDateKey } from './daily-quiz-repository';
import type { DailyResult } from './daily-quiz-repository';

// 型・ユーティリティの再エクスポート
export type { DailyResult };
export { formatDateKey };

const repository = new DailyQuizRepository(new LocalStorageAdapter());

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
