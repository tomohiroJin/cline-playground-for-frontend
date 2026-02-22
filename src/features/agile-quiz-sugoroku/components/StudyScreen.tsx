/**
 * 勉強会モード - 学習画面
 */
import React, { useState, useMemo } from 'react';
import { useKeys } from '../hooks';
import { Question } from '../types';
import { COLORS, OPTION_LABELS } from '../constants';
import { shuffle } from '../game-logic';
import { TAG_MAP } from '../questions/tag-master';
import {
  PageWrapper,
  Panel,
  SectionBox,
  Button,
  HotkeyHint,
  Scanlines,
  QuizQuestion,
  OptionsContainer,
  OptionButton,
  OptionLabel,
  OptionText,
  OptionIcon,
  ResultBanner,
  BannerMessage,
  BannerExplain,
  KeyboardHint,
} from './styles';

interface StudyScreenProps {
  question: Question;
  currentIndex: number;
  totalCount: number;
  selectedAnswer: number | null;
  answered: boolean;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onFinish: () => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({
  question,
  currentIndex,
  totalCount,
  selectedAnswer,
  answered,
  onAnswer,
  onNext,
  onFinish,
}) => {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  // 選択肢の順番をシャッフル（問題が変わるたびに再計算）
  const optionOrder = useMemo(
    () => shuffle([0, 1, 2, 3]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question.question]
  );

  const isLastQuestion = currentIndex >= totalCount - 1;

  useKeys((e) => {
    if (answered) {
      if (e.key === 'Enter' || e.key === ' ') {
        onNext();
      }
      return;
    }

    const keyMap: { [key: string]: number } = {
      '1': 0, '2': 1, '3': 2, '4': 3,
      a: 0, b: 1, c: 2, d: 3,
    };
    const displayIndex = keyMap[e.key.toLowerCase()];
    if (displayIndex !== undefined) {
      onAnswer(optionOrder[displayIndex]);
    }
  });

  return (
    <PageWrapper>
      <Scanlines />
      <Panel $fadeIn={false} style={{ maxWidth: 560 }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: COLORS.accent, letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            STUDY MODE
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            {currentIndex + 1} / {totalCount}
          </div>
        </div>

        {/* 進捗バー */}
        <div style={{ height: 3, background: `${COLORS.border}44`, borderRadius: 2, marginBottom: 16 }}>
          <div
            style={{
              height: '100%',
              width: `${((currentIndex + 1) / totalCount) * 100}%`,
              background: COLORS.accent,
              borderRadius: 2,
              transition: 'width 0.3s',
            }}
          />
        </div>

        {/* ジャンルタグ */}
        {question.tags && question.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {question.tags.map((tagId) => {
              const tag = TAG_MAP.get(tagId);
              return (
                <span
                  key={tagId}
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `${tag?.color ?? COLORS.accent}15`,
                    border: `1px solid ${tag?.color ?? COLORS.accent}33`,
                    color: tag?.color ?? COLORS.accent,
                    fontWeight: 600,
                  }}
                >
                  {tag?.name ?? tagId}
                </span>
              );
            })}
          </div>
        )}

        {/* 問題文 */}
        <QuizQuestion>{question.question}</QuizQuestion>

        {/* 選択肢 */}
        <OptionsContainer>
          {optionOrder.map((originalIndex, displayIndex) => {
            const optionText = question.options[originalIndex];
            const isCorrect = originalIndex === question.answer;
            const isSelected = selectedAnswer === originalIndex;
            const hovered = hoveredOption === displayIndex;

            return (
              <OptionButton
                key={originalIndex}
                $answered={answered}
                $isCorrect={isCorrect}
                $isSelected={isSelected}
                $hovered={hovered}
                disabled={answered}
                onClick={() => onAnswer(originalIndex)}
                onMouseEnter={() => setHoveredOption(displayIndex)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                <OptionLabel $answered={answered} $isCorrect={isCorrect} $isSelected={isSelected}>
                  {OPTION_LABELS[displayIndex]}
                </OptionLabel>
                <OptionText>{optionText}</OptionText>
                {answered && isCorrect && <OptionIcon>✓</OptionIcon>}
                {answered && isSelected && !isCorrect && <OptionIcon>✗</OptionIcon>}
              </OptionButton>
            );
          })}
        </OptionsContainer>

        {/* 結果・解説 */}
        {answered && (
          <div>
            <ResultBanner $ok={selectedAnswer === question.answer}>
              <BannerMessage>
                {selectedAnswer === question.answer ? '✓ CORRECT' : '✗ INCORRECT'}
              </BannerMessage>
              {question.explanation && (
                <BannerExplain
                  $color={selectedAnswer === question.answer ? COLORS.green : COLORS.red}
                >
                  💡 {question.explanation}
                </BannerExplain>
              )}
            </ResultBanner>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button $color={COLORS.muted} onClick={onFinish}>
                終了
              </Button>
              <Button onClick={onNext}>
                {isLastQuestion ? '📊 結果を見る' : '▶ Next'}
                <HotkeyHint>[Enter]</HotkeyHint>
              </Button>
            </div>
          </div>
        )}

        {!answered && <KeyboardHint>⌨ A/B/C/D or 1/2/3/4</KeyboardHint>}
      </Panel>
    </PageWrapper>
  );
};
