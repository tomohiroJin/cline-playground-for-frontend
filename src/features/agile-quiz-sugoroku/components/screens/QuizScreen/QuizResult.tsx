/**
 * クイズ結果表示コンポーネント
 * 正解/不正解のフィードバック、コンボエフェクト、解説
 */
import React, { useState } from 'react';
import type { Question, GameStats } from '../../../domain/types';
import { COLORS } from '../../../constants';
import { AQS_IMAGES } from '../../../images';
import { ScoreFloat } from '../../ScoreFloat';
import { ComboEffect } from '../../ComboEffect';
import {
  ResultBanner,
  BannerMessage,
  BannerExplain,
  Button,
  HotkeyHint,
} from '../../styles';

interface QuizResultProps {
  quiz: Question;
  selectedAnswer: number;
  stats: GameStats;
  eventIndex: number;
  eventsLength: number;
  scoreText: string;
  isComboBreak: boolean;
  onNext: () => void;
}

/** フィードバック画像を選択する */
function getFeedbackImage(selectedAnswer: number, correctAnswer: number): string {
  if (selectedAnswer === -1) return AQS_IMAGES.feedback.timeup;
  if (selectedAnswer === correctAnswer) return AQS_IMAGES.feedback.correct;
  return AQS_IMAGES.feedback.incorrect;
}

/** フィードバックメッセージを選択する */
function getFeedbackMessage(selectedAnswer: number, correctAnswer: number): string {
  if (selectedAnswer === -1) return '⏱️ TIME UP';
  if (selectedAnswer === correctAnswer) return '✓ CORRECT';
  return '✗ INCORRECT';
}

/**
 * 回答後の結果表示
 */
export const QuizResult: React.FC<QuizResultProps> = ({
  quiz,
  selectedAnswer,
  stats,
  eventIndex,
  eventsLength,
  scoreText,
  isComboBreak,
  onNext,
}) => {
  const [imgError, setImgError] = useState(false);
  const isCorrect = selectedAnswer === quiz.answer;

  return (
    <div>
      <ResultBanner $ok={isCorrect}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {!imgError && (
            <img
              src={getFeedbackImage(selectedAnswer, quiz.answer)}
              alt=""
              aria-hidden="true"
              onError={() => setImgError(true)}
              style={{
                width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
                marginBottom: 8, border: '2px solid white',
              }}
            />
          )}
          {scoreText && isCorrect && (
            <ScoreFloat text={scoreText} color={COLORS.green} />
          )}
        </div>
        <BannerMessage>
          {getFeedbackMessage(selectedAnswer, quiz.answer)}
        </BannerMessage>
        {isCorrect && stats.combo >= 2 && (
          <div style={{ marginTop: 6 }}>
            <ComboEffect combo={stats.combo} />
          </div>
        )}
        {isComboBreak && (
          <div style={{ marginTop: 6 }}>
            <ComboEffect combo={0} isBreak />
          </div>
        )}
        {quiz.explanation && (
          <BannerExplain $color={isCorrect ? COLORS.green : COLORS.red}>
            💡 {quiz.explanation}
          </BannerExplain>
        )}
      </ResultBanner>
      <div style={{ textAlign: 'right' }}>
        <Button onClick={onNext}>
          {eventIndex + 1 >= eventsLength ? '▶ Retrospective' : '▶ Next'}
          <HotkeyHint>[Enter]</HotkeyHint>
        </Button>
      </div>
    </div>
  );
};
