/**
 * デイリークイズ問題表示コンポーネント
 */
import React from 'react';
import { COLORS, FONTS } from '../constants';
import type { Question } from '../domain/types';
import { ParticleEffect } from './ParticleEffect';
import {
  PageWrapper,
  Panel,
  SectionBox,
  Button,
  HotkeyHint,
  Scanlines,
} from './styles';

/** デイリークイズの出題数 */
const DAILY_QUESTION_COUNT = 5;

interface DailyQuizQuestionProps {
  currentIndex: number;
  currentQuestion: Question;
  selectedAnswer: number | undefined;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
}

export const DailyQuizQuestion: React.FC<DailyQuizQuestionProps> = ({
  currentIndex,
  currentQuestion,
  selectedAnswer,
  onAnswer,
  onNext,
}) => (
  <PageWrapper>
    <ParticleEffect />
    <Scanlines />
    <Panel $visible={true} style={{ maxWidth: 520 }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
      }}>
        <div style={{
          fontSize: 10, color: COLORS.accent, letterSpacing: 2,
          fontFamily: FONTS.mono, fontWeight: 700,
        }}>
          DAILY QUIZ
        </div>
        <div style={{
          fontSize: 12, color: COLORS.muted, fontFamily: FONTS.mono,
        }}>
          {currentIndex + 1} / {DAILY_QUESTION_COUNT}
        </div>
      </div>

      {/* 問題文 */}
      <SectionBox>
        <div style={{
          fontSize: 14, color: COLORS.text, lineHeight: 1.7, marginBottom: 16,
        }}>
          {currentQuestion.question}
        </div>

        {/* 選択肢 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQuestion.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === currentQuestion.answer;
            const isAnswered = selectedAnswer !== undefined;
            let bgColor = `${COLORS.accent}08`;
            let borderColor = `${COLORS.accent}18`;

            if (isAnswered) {
              if (isCorrect) {
                bgColor = `${COLORS.green}15`;
                borderColor = COLORS.green;
              } else if (isSelected) {
                bgColor = `${COLORS.red}15`;
                borderColor = COLORS.red;
              }
            }

            return (
              <button
                key={`opt-${i}`}
                onClick={() => onAnswer(i)}
                disabled={isAnswered}
                style={{
                  padding: '10px 14px',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  color: COLORS.text,
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  opacity: isAnswered && !isSelected && !isCorrect ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  fontFamily: FONTS.mono, color: COLORS.muted,
                  marginRight: 8, fontSize: 11,
                }}>
                  {i + 1}.
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </SectionBox>

      {/* 解説（回答後） */}
      {selectedAnswer !== undefined && currentQuestion.explanation && (
        <SectionBox>
          <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
            {currentQuestion.explanation}
          </div>
        </SectionBox>
      )}

      {/* 次へボタン（回答後） */}
      {selectedAnswer !== undefined && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button onClick={onNext}>
            {currentIndex + 1 >= DAILY_QUESTION_COUNT ? '結果を見る' : '次の問題へ'}
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
        </div>
      )}
    </Panel>
  </PageWrapper>
);
