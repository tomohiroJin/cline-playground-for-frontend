import React, { useCallback } from 'react';
import type { InputAction } from '../types';
import {
  ControlsRow,
  ButtonGroup,
  DirButton,
  ActionButton,
  ButtonLabel,
} from './styles';

interface Props {
  onInput: (action: InputAction) => void;
}

// LEFT / ACTION / RIGHT 3ボタンUI
const ControlButtons: React.FC<Props> = ({ onInput }) => {
  const handleLeft = useCallback(() => onInput('left'), [onInput]);
  const handleAction = useCallback(() => onInput('act'), [onInput]);
  const handleRight = useCallback(() => onInput('right'), [onInput]);

  return (
    <ControlsRow>
      <ButtonGroup>
        <DirButton onClick={handleLeft} aria-label="左移動">
          ◀
        </DirButton>
        <ButtonLabel>LEFT</ButtonLabel>
      </ButtonGroup>
      <ButtonGroup>
        <ActionButton onClick={handleAction} aria-label="アクション">
          ●
        </ActionButton>
        <ButtonLabel>ACTION</ButtonLabel>
      </ButtonGroup>
      <ButtonGroup>
        <DirButton onClick={handleRight} aria-label="右移動">
          ▶
        </DirButton>
        <ButtonLabel>RIGHT</ButtonLabel>
      </ButtonGroup>
    </ControlsRow>
  );
};

export default ControlButtons;
