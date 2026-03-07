/**
 * デイリークイズ画面コンポーネント
 *
 * 毎日5問の日替わりクイズを提供する
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useKeys } from '../hooks';
import { Question } from '../types';
import { COLORS, FONTS } from '../constants';
import {
  getDailyQuestions,
  saveDailyResult,
  getDailyResult,
  getDailyStreak,
  formatDateKey,
  DailyResult,
} from '../daily-quiz';
import { ParticleEffect } from './ParticleEffect';
import {
  PageWrapper,
  Panel,
  SectionBox,
  SectionTitle,
  Button,
  HotkeyHint,
  Scanlines,
} from './styles';

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
      // 終了 - 結果を保存（correctCount は handleAnswer で既に更新済み）
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
  }, [currentIndex, correctCount, selectedAnswer, currentQuestion, dateKey]);

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
    // 1-4キーで回答
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 4 && currentQuestion) {
      handleAnswer(num - 1);
    }
  });

  // 結果画面
  if (finished && result) {
    return (
      <PageWrapper>
        <ParticleEffect />
        <Scanlines />
        <Panel $visible={true} style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              fontSize: 10,
              color: COLORS.accent,
              letterSpacing: 3,
              fontFamily: FONTS.mono,
              fontWeight: 700,
            }}>
              DAILY QUIZ
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              color: COLORS.text2,
              marginTop: 6,
            }}>
              {dateKey}
            </div>
          </div>

          <SectionBox>
            <SectionTitle>RESULT</SectionTitle>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: result.correctCount >= 4 ? COLORS.green : result.correctCount >= 2 ? COLORS.yellow : COLORS.red,
                fontFamily: FONTS.mono,
              }}>
                {result.correctCount} / {result.totalCount}
              </div>
              <div style={{
                fontSize: 12,
                color: COLORS.muted,
                marginTop: 4,
              }}>
                正解数
              </div>
            </div>
          </SectionBox>

          {streak > 0 && (
            <SectionBox>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 14,
                  color: COLORS.yellow,
                  fontWeight: 700,
                }}>
                  {streak} 日連続参加中！
                </div>
              </div>
            </SectionBox>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={onBack}>
              タイトルに戻る
              <HotkeyHint>[Enter]</HotkeyHint>
            </Button>
          </div>
        </Panel>
      </PageWrapper>
    );
  }

  // クイズ画面
  if (!currentQuestion) return null;

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />
      <Panel $visible={true} style={{ maxWidth: 520 }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 10,
            color: COLORS.accent,
            letterSpacing: 2,
            fontFamily: FONTS.mono,
            fontWeight: 700,
          }}>
            DAILY QUIZ
          </div>
          <div style={{
            fontSize: 12,
            color: COLORS.muted,
            fontFamily: FONTS.mono,
          }}>
            {currentIndex + 1} / {DAILY_QUESTION_COUNT}
          </div>
        </div>

        {/* 問題文 */}
        <SectionBox>
          <div style={{
            fontSize: 14,
            color: COLORS.text,
            lineHeight: 1.7,
            marginBottom: 16,
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
                  key={i}
                  onClick={() => handleAnswer(i)}
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
                    fontFamily: FONTS.mono,
                    color: COLORS.muted,
                    marginRight: 8,
                    fontSize: 11,
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
            <div style={{
              fontSize: 12,
              color: COLORS.muted,
              lineHeight: 1.6,
            }}>
              {currentQuestion.explanation}
            </div>
          </SectionBox>
        )}

        {/* 次へボタン（回答後） */}
        {selectedAnswer !== undefined && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button onClick={handleNext}>
              {currentIndex + 1 >= DAILY_QUESTION_COUNT ? '結果を見る' : '次の問題へ'}
              <HotkeyHint>[Enter]</HotkeyHint>
            </Button>
          </div>
        )}
      </Panel>
    </PageWrapper>
  );
};
