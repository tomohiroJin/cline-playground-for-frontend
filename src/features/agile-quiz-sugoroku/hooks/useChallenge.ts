/**
 * チャレンジモード（サバイバル）フック
 *
 * 1ミスで即終了のサバイバルモード
 */
import { useState, useCallback, useRef } from 'react';
import { Question, AnswerResult } from '../types';
import { QUESTIONS } from '../quiz-data';
import { shuffle, pickQuestion } from '../game-logic';
import { saveHighScore } from '../challenge-storage';

/** 全カテゴリのキー一覧 */
const ALL_CATEGORIES = Object.keys(QUESTIONS);

interface UseChallengeReturn {
  /** 現在の問題 */
  quiz: Question | null;
  /** 選択肢の並び順 */
  options: number[];
  /** 選択された回答 */
  selectedAnswer: number | null;
  /** 正解数 */
  correctCount: number;
  /** 最大コンボ */
  maxCombo: number;
  /** 現在のコンボ */
  combo: number;
  /** ゲームオーバーフラグ */
  isGameOver: boolean;
  /** 回答済みフラグ */
  isAnswered: boolean;
  /** 初期化 */
  init: () => void;
  /** 回答処理 */
  answer: (optionIndex: number) => AnswerResult | null;
  /** 次の問題へ */
  next: () => void;
}

export function useChallenge(): UseChallengeReturn {
  const [quiz, setQuiz] = useState<Question | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const usedQuestions = useRef<Record<string, Set<number>>>({});
  const startTime = useRef(0);

  /** ランダムカテゴリから問題を取得 */
  const loadNextQuestion = useCallback(() => {
    const shuffledCategories = shuffle([...ALL_CATEGORIES]);
    for (const category of shuffledCategories) {
      const questions = QUESTIONS[category];
      if (!questions || questions.length === 0) continue;
      const used = usedQuestions.current[category];
      if (used && used.size >= questions.length) continue;

      const { question, index } = pickQuestion(questions, used);
      if (!usedQuestions.current[category]) {
        usedQuestions.current[category] = new Set();
      }
      usedQuestions.current[category].add(index);

      setQuiz(question);
      setOptions(shuffle([0, 1, 2, 3]));
      setSelectedAnswer(null);
      setIsAnswered(false);
      startTime.current = Date.now();
      return;
    }
    // 全問題を使い切った場合
    setIsGameOver(true);
  }, []);

  /** 初期化 */
  const init = useCallback(() => {
    usedQuestions.current = {};
    setCorrectCount(0);
    setCombo(0);
    setMaxCombo(0);
    setIsGameOver(false);
    setIsAnswered(false);
    loadNextQuestion();
  }, [loadNextQuestion]);

  /** 回答処理 */
  const answer = useCallback((optionIndex: number): AnswerResult | null => {
    if (isAnswered || !quiz || isGameOver) return null;
    setIsAnswered(true);

    const speed = Math.round((Date.now() - startTime.current) / 100) / 10;
    const correct = optionIndex === quiz.answer;
    setSelectedAnswer(optionIndex);

    if (correct) {
      const newCombo = combo + 1;
      setCorrectCount(prev => prev + 1);
      setCombo(newCombo);
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
    } else {
      // 不正解 → ゲームオーバー
      setCombo(0);
      setIsGameOver(true);
      // ハイスコア保存
      saveHighScore(correctCount);
    }

    return { correct, speed, eventId: 'challenge' };
  }, [isAnswered, quiz, isGameOver, combo, maxCombo, correctCount]);

  /** 次の問題へ */
  const next = useCallback(() => {
    if (isGameOver) return;
    loadNextQuestion();
  }, [isGameOver, loadNextQuestion]);

  return {
    quiz,
    options,
    selectedAnswer,
    correctCount,
    maxCombo,
    combo,
    isGameOver,
    isAnswered,
    init,
    answer,
    next,
  };
}
