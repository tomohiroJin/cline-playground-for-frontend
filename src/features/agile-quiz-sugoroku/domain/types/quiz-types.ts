/**
 * クイズ・問題に関するドメイン型定義
 */

/** クイズ問題 */
export interface Question {
  question: string;
  options: string[];
  answer: number;
  tags?: string[];
  explanation?: string;
}

/** カテゴリ別の問題データ */
export type QuestionsByCategory = {
  [key: string]: Question[];
};

/** 回答結果 */
export interface AnswerResult {
  correct: boolean;
  speed: number;
  eventId: string;
}

/** 回答結果の詳細（タグ・問題情報付き） */
export interface AnswerResultWithDetail {
  questionText: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  correct: boolean;
  tags: string[];
  explanation?: string;
  eventId: string;
}

/** ジャンル別統計 */
export interface TagStats {
  [tagId: string]: {
    correct: number;
    total: number;
  };
}

/** 解説データ */
export type ExplanationMap = {
  [eventId: string]: {
    [questionIndex: number]: string;
  };
};
