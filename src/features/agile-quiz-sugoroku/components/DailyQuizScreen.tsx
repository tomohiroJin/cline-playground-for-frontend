/**
 * デイリークイズ画面コンポーネント
 *
 * 毎日5問の日替わりクイズを提供する
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useKeys } from '../hooks';
import { Question } from '../domain/types';
import {
  getDailyQuestions,
  saveDailyResult,
  getDailyResult,
  getDailyStreak,
  formatDateKey,
  DailyResult,
} from '../daily-quiz';
import { DailyQuizResult } from './DailyQuizResult';
import { DailyQuizQuestion } from './DailyQuizQuestion';

/** デイリークイズの出題数 */
const DAILY_QUESTION_COUNT = 5;

interface DailyQuizScreenProps {
  /** タイトルに戻る */
  onBack: () => void;
}

/**
 * デイリークイズ画面
 */
export const DailyQuizScreen: React.FC<DailyQuizScreenProps> = ({ onBack }) => {
  const today = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => formatDateKey(today), [today]);
  const questions = useMemo(() => getDailyQuestions(today), [today]);

  // 既にプレイ済みかチェック
  const existingResult = useMemo(() => getDailyResult(dateKey), [dateKey]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>(undefined);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(existingResult !== undefined);
  const [result, setResult] = useState<DailyResult | undefined>(existingResult);

  const currentQuestion: Question | undefined = questions[currentIndex];

  /** 回答処理 */
  const handleAnswer = useCallback((optionIndex: number) => {
    if (selectedAnswer !== undefined) return;
    setSelectedAnswer(optionIndex);
    if (optionIndex === currentQuestion?.answer) {
      setCorrectCount((c) => c + 1);
    }
  }, [selectedAnswer, currentQuestion]);

  /** 次の問題へ */
  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= DAILY_QUESTION_COUNT) {
      const dailyResult: DailyResult = {
        dateKey,
        correctCount,
        totalCount: DAILY_QUESTION_COUNT,
        timestamp: Date.now(),
      };
      saveDailyResult(dailyResult);
      setResult(dailyResult);
      setFinished(true);
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(undefined);
    }
  }, [currentIndex, correctCount, dateKey]);

  const streak = useMemo(() => {
    if (!finished || !result) return 0;
    return getDailyStreak(today);
  }, [finished, result, today]);

  useKeys((e) => {
    if (e.key === 'Escape') {
      onBack();
      return;
    }
    if (finished) {
      if (e.key === 'Enter') onBack();
      return;
    }
    if (selectedAnswer !== undefined) {
      if (e.key === 'Enter' || e.key === ' ') handleNext();
      return;
    }
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 4 && currentQuestion) {
      handleAnswer(num - 1);
    }
  });

  // 結果画面
  if (finished && result) {
    return (
      <DailyQuizResult
        result={result}
        dateKey={dateKey}
        streak={streak}
        onBack={onBack}
      />
    );
  }

  // クイズ画面
  if (!currentQuestion) return null;

  return (
    <DailyQuizQuestion
      currentIndex={currentIndex}
      currentQuestion={currentQuestion}
      selectedAnswer={selectedAnswer}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  );
};
