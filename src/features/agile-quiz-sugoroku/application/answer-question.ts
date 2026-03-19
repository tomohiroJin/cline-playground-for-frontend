/**
 * 回答処理ユースケース
 *
 * domain の回答評価・負債計算・統計更新と
 * infrastructure の AudioPort（効果音再生）を組み合わせる。
 */
import {
  Question,
  GameStats,
  TagStats,
  AnswerResult,
  AnswerResultWithDetail,
} from '../domain/types';
import {
  computeAnswerResult,
  computeDebtDelta,
  nextGameStats,
} from '../domain/quiz/answer-evaluator';
import { AudioPort } from '../infrastructure/audio/audio-port';

/** ユースケース入力 */
export interface AnswerQuestionInput {
  /** 現在の問題 */
  question: Question;
  /** 選択された選択肢インデックス */
  selectedOption: number;
  /** 回答にかかった時間（秒） */
  elapsed: number;
  /** 現在のイベントID */
  eventId: string;
  /** 現在のゲーム統計 */
  currentStats: GameStats;
  /** 現在のタグ別統計 */
  currentTagStats: TagStats;
}

/** ユースケース依存 */
export interface AnswerQuestionDeps {
  audioPort: AudioPort;
}

/** ユースケース出力 */
export interface AnswerQuestionOutput {
  /** 回答結果 */
  answerResult: AnswerResult;
  /** 負債増分 */
  debtDelta: number;
  /** 更新後のゲーム統計 */
  nextStats: GameStats;
  /** 更新後のタグ別統計 */
  tagStats: TagStats;
  /** 不正解時の詳細情報（正解時は undefined） */
  incorrectQuestion?: AnswerResultWithDetail;
}

/**
 * 回答処理を実行する
 *
 * 1. 回答結果を評価（domain）
 * 2. 負債増分を計算（domain）
 * 3. ゲーム統計を更新（domain）
 * 4. タグ別統計を更新
 * 5. 不正解時に詳細を記録
 * 6. 効果音を再生（infrastructure）
 */
export function executeAnswerQuestion(
  input: AnswerQuestionInput,
  deps: AnswerQuestionDeps,
): AnswerQuestionOutput {
  const { question, selectedOption, elapsed, eventId, currentStats, currentTagStats } = input;
  const { audioPort } = deps;

  // 1. 回答結果を評価
  const answerResult = computeAnswerResult({
    optionIndex: selectedOption,
    correctAnswer: question.answer,
    speed: elapsed,
    eventId,
  });

  // 2. 負債増分を計算
  const debtDelta = computeDebtDelta(answerResult.correct, eventId);

  // 3. ゲーム統計を更新
  const updatedStats = nextGameStats(currentStats, answerResult, debtDelta);

  // 4. タグ別統計を更新
  const tagStats = updateTagStats(currentTagStats, question.tags, answerResult.correct);

  // 5. 不正解時に詳細を記録
  const incorrectQuestion = answerResult.correct
    ? undefined
    : buildIncorrectQuestion(question, selectedOption, eventId);

  // 6. 効果音を再生
  if (answerResult.correct) {
    audioPort.playSfxCorrect();
  } else {
    audioPort.playSfxIncorrect();
  }

  return {
    answerResult,
    debtDelta,
    nextStats: updatedStats,
    tagStats,
    incorrectQuestion,
  };
}

/** タグ別統計を更新する */
function updateTagStats(
  current: TagStats,
  tags: string[] | undefined,
  isCorrect: boolean,
): TagStats {
  if (!tags || tags.length === 0) return { ...current };

  const next = { ...current };
  for (const tag of tags) {
    const prev = next[tag] ?? { correct: 0, total: 0 };
    next[tag] = {
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    };
  }
  return next;
}

/** 不正解問題の詳細を構築する */
function buildIncorrectQuestion(
  question: Question,
  selectedOption: number,
  eventId: string,
): AnswerResultWithDetail {
  return {
    questionText: question.question,
    options: question.options,
    selectedAnswer: selectedOption,
    correctAnswer: question.answer,
    correct: false,
    tags: question.tags ?? [],
    explanation: question.explanation,
    eventId,
  };
}
