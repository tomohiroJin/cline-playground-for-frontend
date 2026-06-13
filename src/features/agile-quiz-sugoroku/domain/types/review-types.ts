/**
 * 復習機能に関するドメイン型定義
 */
import type { Question } from './quiz-types';

/**
 * 復習エントリ（問題のスナップショット）。
 * 問題データの後日改変に影響されないよう参照ではなくコピーで保持する。
 */
export interface ReviewEntry {
  /** 同定キー（makeQuestionKey の結果） */
  key: string;
  /** 問題のスナップショット */
  question: Question;
  /** 記録時刻（ミリ秒。テスト容易性のため呼び出し側から渡す） */
  recordedAt: number;
}
