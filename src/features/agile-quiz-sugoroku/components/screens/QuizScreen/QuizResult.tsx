/**
 * クイズ結果表示コンポーネント
 * 正解/不正解のフィードバック、コンボエフェクト、解説
 */
import React from 'react';
import type { Question, GameStats } from '../../../types';
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
  const explanation = quiz.explanation;

  return (
    <div>
      <ResultBanner $ok={selectedAnswer === quiz.answer}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={selectedAnswer === -1
              ? AQS_IMAGES.feedback.timeup
              : selectedAnswer === quiz.answer
                ? AQS_IMAGES.feedback.correct
                : AQS_IMAGES.feedback.incorrect}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{
              width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
              marginBottom: 8, border: '2px solid white',
            }}
          />
          {scoreText && selectedAnswer === quiz.answer && (
            <ScoreFloat text={scoreText} color={COLORS.green} />
          )}
        </div>
        <BannerMessage>
          {selectedAnswer === -1
            ? '⏱️ TIME UP'
            : selectedAnswer === quiz.answer
            ? '✓ CORRECT'
            : '✗ INCORRECT'}
        </BannerMessage>
        {selectedAnswer === quiz.answer && stats.combo >= 2 && (
          <div style={{ marginTop: 6 }}>
            <ComboEffect combo={stats.combo} />
          </div>
        )}
        {isComboBreak && (
          <div style={{ marginTop: 6 }}>
            <ComboEffect combo={0} isBreak />
          </div>
        )}
        {explanation && (
          <BannerExplain $color={selectedAnswer === quiz.answer ? COLORS.green : COLORS.red}>
            💡 {explanation}
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
