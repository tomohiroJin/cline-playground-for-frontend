/**
 * チャレンジモード専用クイズ画面コンポーネント
 * 通常モード（QuizScreen）とは異なり、スプリント/すごろく/イベント表示を省略し、
 * チャレンジ固有のヘッダー（正解数・コンボ）を表示する
 */
import React, { useMemo } from 'react';
import { useQuizFeedback, useQuizKeys } from '../../../hooks';
import type { Question } from '../../../domain/types';
import { FlashOverlay } from '../../FlashOverlay';
import { ComboEffect } from '../../ComboEffect';
import { CharacterReaction } from '../../CharacterReaction';
import {
  PageWrapper,
  Panel,
  Scanlines,
  ChallengeHeader,
  QuizQuestion,
  KeyboardHint,
} from '../../styles';
import { TimerDisplay } from '../QuizScreen/TimerDisplay';
import { OptionsPanel } from '../QuizScreen/OptionsPanel';
import { QuizResult } from '../QuizScreen/QuizResult';
import { determineReaction } from '../QuizScreen/quiz-helpers';

interface ChallengeQuizScreenProps {
  quiz: Question;
  options: number[];
  selectedAnswer: number | null;
  combo: number;
  maxCombo: number;
  correctCount: number;
  isGameOver: boolean;
  timer: number;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
}

export const ChallengeQuizScreen: React.FC<ChallengeQuizScreenProps> = ({
  quiz,
  options,
  selectedAnswer,
  combo,
  maxCombo,
  correctCount,
  isGameOver,
  timer,
  onAnswer,
  onNext,
}) => {
  const answered = selectedAnswer !== null;

  const { feedback, isComboBreak } = useQuizFeedback({
    answered, selectedAnswer, correctAnswer: quiz.answer, combo,
  });

  const reactionSituation = determineReaction(
    answered, selectedAnswer, false, combo, quiz.answer,
  );

  // チャレンジ用の GameStats（QuizResult が必要とする最小限のフィールド）
  const stats = useMemo(() => ({
    totalCorrect: correctCount,
    totalQuestions: correctCount + (isGameOver ? 1 : 0),
    speeds: [] as number[],
    debt: 0,
    emergencyCount: 0,
    emergencySuccess: 0,
    combo,
    maxCombo,
  }), [correctCount, isGameOver, combo, maxCombo]);

  useQuizKeys({ answered, options, onAnswer, onNext });

  return (
    <PageWrapper>
      <FlashOverlay type={feedback.flashType} />
      <Scanlines />
      <Panel $visible>
        <ChallengeHeader>
          <span>🔥 チャレンジモード</span>
          <span>正解数: {correctCount}</span>
        </ChallengeHeader>

        <TimerDisplay timer={timer} answered={answered} />
        <QuizQuestion>{quiz.question}</QuizQuestion>
        <OptionsPanel quiz={quiz} options={options} selectedAnswer={selectedAnswer} onAnswer={onAnswer} />

        {!answered && combo >= 2 && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <ComboEffect combo={combo} />
          </div>
        )}

        {answered && selectedAnswer !== null && (
          <QuizResult
            quiz={quiz}
            selectedAnswer={selectedAnswer}
            stats={stats}
            scoreText={feedback.scoreText}
            isComboBreak={isComboBreak}
            onNext={onNext}
            nextButtonLabel="▶ Next"
          />
        )}

        {!answered && <KeyboardHint>⌨ A/B/C/D or 1/2/3/4</KeyboardHint>}
        <CharacterReaction situation={reactionSituation} timer={answered ? undefined : timer} quizTags={quiz.tags} />
      </Panel>
    </PageWrapper>
  );
};
