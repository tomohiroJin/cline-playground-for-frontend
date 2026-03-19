/**
 * クイズフィードバック管理フック
 * フラッシュ表示・スコアテキスト・コンボブレイク判定を統合管理する
 */
import { useState, useEffect } from 'react';
import type { FeedbackState } from '../components/screens/QuizScreen/quiz-helpers';
import { INITIAL_FEEDBACK } from '../components/screens/QuizScreen/quiz-helpers';

interface UseQuizFeedbackParams {
  answered: boolean;
  selectedAnswer: number | null;
  correctAnswer: number;
  combo: number;
}

interface UseQuizFeedbackReturn {
  feedback: FeedbackState;
  isComboBreak: boolean;
}

/**
 * クイズ回答後のフィードバック状態を管理する
 * フラッシュエフェクトの表示・自動解除、コンボブレイク判定を行う
 */
export function useQuizFeedback({
  answered,
  selectedAnswer,
  correctAnswer,
  combo,
}: UseQuizFeedbackParams): UseQuizFeedbackReturn {
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);
  const [prevCombo, setPrevCombo] = useState(0);

  const isComboBreak = answered && prevCombo >= 2 && combo === 0;

  useEffect(() => {
    if (!answered) {
      setFeedback(INITIAL_FEEDBACK);
      return;
    }
    if (selectedAnswer === -1) {
      setFeedback({ flashType: 'timeup', scoreText: '' });
    } else if (selectedAnswer === correctAnswer) {
      setFeedback({ flashType: 'correct', scoreText: '+10pt' });
    } else {
      setFeedback({ flashType: 'incorrect', scoreText: '' });
    }
    setPrevCombo(combo);
    // フラッシュを自動解除
    const tid = setTimeout(() => setFeedback((prev) => ({ ...prev, flashType: undefined })), 600);
    return () => clearTimeout(tid);
  // 意図的に answered のみを依存配列にしている:
  // フラッシュ・スコア表示は「回答した瞬間」にのみトリガーする。
  }, [answered]); // eslint-disable-line react-hooks/exhaustive-deps

  return { feedback, isComboBreak };
}
