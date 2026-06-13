/**
 * 勉強会モード用フック
 */
import { useState, useCallback, useMemo } from 'react';
import { Question, TagStats, AnswerResultWithDetail } from '../../domain/types';
import { buildStudyPool } from '../../domain/quiz';
import { LocalStorageAdapter } from '../../infrastructure/storage/local-storage-adapter';
import { StudyProgressRepository } from '../../infrastructure/storage/study-progress-repository';
import { AchievementRepository } from '../../infrastructure/storage/achievement-repository';

/** 「学習の鬼」実績（勉強会モード累計回答）の到達目標 */
const STUDY_ACHIEVEMENT_GOAL = 100;

const studyProgressRepo = new StudyProgressRepository(new LocalStorageAdapter());
const achievementRepo = new AchievementRepository(new LocalStorageAdapter());

export interface UseStudyReturn {
  /** 問題リスト */
  questions: Question[];
  /** 現在の問題インデックス */
  currentIndex: number;
  /** 現在の問題 */
  currentQuestion: Question | null;
  /** 選択した回答 */
  selectedAnswer: number | null;
  /** 回答済みか */
  answered: boolean;
  /** ジャンル別統計 */
  tagStats: TagStats;
  /** 不正解問題リスト */
  incorrectQuestions: AnswerResultWithDetail[];
  /** 全体正解数 */
  totalCorrect: number;
  /** 全体回答数 */
  totalAnswered: number;
  /** 終了フラグ */
  finished: boolean;
  /** 学習を初期化 */
  init: (selectedTags: string[], limit: number) => void;
  /** 外部の問題配列で学習を初期化（復習モード用） */
  initWithQuestions: (questions: Question[]) => void;
  /** 回答を処理 */
  answer: (optionIndex: number) => void;
  /** 次の問題へ */
  next: () => void;
  /** 学習を終了 */
  finish: () => void;
}

export function useStudy(): UseStudyReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [tagStats, setTagStats] = useState<TagStats>({});
  const [incorrectQuestions, setIncorrectQuestions] = useState<AnswerResultWithDetail[]>([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = useMemo(() => {
    if (currentIndex < questions.length) return questions[currentIndex];
    return null;
  }, [questions, currentIndex]);

  /** セッション状態を初期化する共通処理。init / initWithQuestions の両者から委譲される（外部非公開）。 */
  const resetSession = useCallback((pool: Question[]) => {
    setQuestions(pool);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setTagStats({});
    setIncorrectQuestions([]);
    setTotalCorrect(0);
    setTotalAnswered(0);
    setFinished(false);
  }, []);

  const init = useCallback((selectedTags: string[], limit: number) => {
    resetSession(buildStudyPool(selectedTags, limit));
  }, [resetSession]);

  /** 外部の問題配列で学習を初期化する（復習モード用）。buildStudyPool を経由せず渡された配列をそのまま使う。 */
  const initWithQuestions = useCallback((qs: Question[]) => {
    resetSession(qs);
  }, [resetSession]);

  const answer = useCallback(
    (optionIndex: number) => {
      if (answered || !currentQuestion) return;

      const isCorrect = optionIndex === currentQuestion.answer;
      setSelectedAnswer(optionIndex);
      setAnswered(true);
      setTotalAnswered((prev) => prev + 1);

      // セッションをまたいだ累計回答数を永続化し、目標到達で「学習の鬼」実績を解除する
      const cumulativeAnswered = studyProgressRepo.incrementAnswered();
      if (cumulativeAnswered >= STUDY_ACHIEVEMENT_GOAL) {
        achievementRepo.saveUnlock('study-100', Date.now());
      }

      if (isCorrect) {
        setTotalCorrect((prev) => prev + 1);
      }

      // タグ別統計更新
      if (currentQuestion.tags) {
        setTagStats((prev) => {
          const next = { ...prev };
          for (const tag of currentQuestion.tags!) {
            if (!next[tag]) {
              next[tag] = { correct: 0, total: 0 };
            }
            next[tag] = {
              correct: next[tag].correct + (isCorrect ? 1 : 0),
              total: next[tag].total + 1,
            };
          }
          return next;
        });
      }

      // 不正解を蓄積
      if (!isCorrect) {
        setIncorrectQuestions((prev) => [
          ...prev,
          {
            questionText: currentQuestion.question,
            options: currentQuestion.options,
            selectedAnswer: optionIndex,
            correctAnswer: currentQuestion.answer,
            correct: false,
            tags: currentQuestion.tags ?? [],
            explanation: currentQuestion.explanation,
            eventId: 'study',
          },
        ]);
      }
    },
    [answered, currentQuestion]
  );

  const next = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  }, [currentIndex, questions.length]);

  const finish = useCallback(() => {
    setFinished(true);
  }, []);

  return {
    questions,
    currentIndex,
    currentQuestion,
    selectedAnswer,
    answered,
    tagStats,
    incorrectQuestions,
    totalCorrect,
    totalAnswered,
    finished,
    init,
    initWithQuestions,
    answer,
    next,
    finish,
  };
}
