// 難易度選択コンポーネント

import React from 'react';
import styled from 'styled-components';
import type { Difficulty } from '../types';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../difficulty';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

const Container = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const DifficultyBtn = styled.button<{ $color: string; $isSelected: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-weight: 700;
  font-size: 0.75rem;
  color: white;
  border: 2px solid ${props => (props.$isSelected ? 'white' : 'transparent')};
  cursor: pointer;
  background-color: ${props => props.$color};
  opacity: ${props => (props.$isSelected ? 1 : 0.6)};
  transition: all 0.2s;

  &:hover {
    opacity: 1;
  }
`;

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selected,
  onSelect,
}) => (
  <Container>
    {DIFFICULTY_ORDER.map(key => {
      const config = DIFFICULTIES[key];
      return (
        <DifficultyBtn
          key={key}
          $color={config.color}
          $isSelected={selected === key}
          onClick={() => onSelect(key)}
          aria-label={`難易度: ${config.label}`}
          aria-pressed={selected === key}
        >
          {config.label}
        </DifficultyBtn>
      );
    })}
  </Container>
);
