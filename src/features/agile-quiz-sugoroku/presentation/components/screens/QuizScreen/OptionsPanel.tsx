/**
 * 選択肢パネルコンポーネント
 * 4つの選択肢ボタンを表示し、スクリーンリーダー向けの ARIA セマンティクスを提供する
 */
import React, { useState } from 'react';
import type { Question } from '../../../../domain/types';
import { OPTION_LABELS } from '../../../../constants';
import {
  OptionsContainer,
  OptionButton,
  OptionLabel,
  OptionText,
  OptionIcon,
} from '../../../styles';
import { SR_ONLY_STYLE } from '../../../styles/sr-only';

interface OptionsPanelProps {
  /** 問題データ */
  quiz: Question;
  /** 選択肢の並び順 */
  options: number[];
  /** 選択された回答（null=未回答） */
  selectedAnswer: number | null;
  /** 回答時のコールバック */
  onAnswer: (optionIndex: number) => void;
}

/**
 * 選択肢パネル
 * WCAG 2.1 AA 準拠: radiogroup ロール・radio ロール・aria-live フィードバック
 */
export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  quiz,
  options,
  selectedAnswer,
  onAnswer,
}) => {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const answered = selectedAnswer !== null;
  // 回答後のフィードバックメッセージ（aria-live リージョン用）
  const feedbackMessage = (() => {
    if (!answered) return '';
    const isCorrect = selectedAnswer === quiz.answer;
    return isCorrect ? '正解です' : '不正解です';
  })();

  return (
    <>
      {/* スクリーンリーダー向け回答フィードバック */}
      <div role="status" aria-live="polite" style={SR_ONLY_STYLE}>
        {feedbackMessage}
      </div>
      <OptionsContainer role="radiogroup" aria-label="回答の選択肢">
        {options.map((optionIndex, i) => {
          const isCorrect = optionIndex === quiz.answer;
          const isSelected = selectedAnswer !== null && selectedAnswer === optionIndex;
          const hovered = hoveredOption === i;
          const optionText = quiz.options[optionIndex];

          return (
            <OptionButton
              key={optionIndex}
              role="radio"
              aria-checked={isSelected}
              aria-label={`選択肢 ${OPTION_LABELS[i]}: ${optionText}`}
              $answered={answered}
              $isCorrect={isCorrect}
              $isSelected={isSelected}
              $hovered={hovered}
              disabled={answered}
              onClick={() => onAnswer(optionIndex)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <OptionLabel
                $answered={answered}
                $isCorrect={isCorrect}
                $isSelected={isSelected}
              >
                {OPTION_LABELS[i]}
              </OptionLabel>
              <OptionText>{optionText}</OptionText>
              {answered && isCorrect && <OptionIcon>✓</OptionIcon>}
              {answered && isSelected && !isCorrect && <OptionIcon>✗</OptionIcon>}
            </OptionButton>
          );
        })}
      </OptionsContainer>
    </>
  );
};
