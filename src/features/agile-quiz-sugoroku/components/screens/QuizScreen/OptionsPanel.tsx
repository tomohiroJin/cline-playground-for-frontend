/**
 * 選択肢パネルコンポーネント
 * 4つの選択肢ボタンを表示
 */
import React, { useState } from 'react';
import type { Question } from '../../../types';
import { OPTION_LABELS } from '../../../constants';
import {
  OptionsContainer,
  OptionButton,
  OptionLabel,
  OptionText,
  OptionIcon,
} from '../../styles';

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
 */
export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  quiz,
  options,
  selectedAnswer,
  onAnswer,
}) => {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);
  const answered = selectedAnswer !== null;

  return (
    <OptionsContainer>
      {options.map((optionIndex, i) => {
        const isCorrect = optionIndex === quiz.answer;
        const isSelected = selectedAnswer === optionIndex;
        const hovered = hoveredOption === i;

        return (
          <OptionButton
            key={i}
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
            <OptionText>{quiz.options[optionIndex]}</OptionText>
            {answered && isCorrect && <OptionIcon>✓</OptionIcon>}
            {answered && isSelected && !isCorrect && <OptionIcon>✗</OptionIcon>}
          </OptionButton>
        );
      })}
    </OptionsContainer>
  );
};
