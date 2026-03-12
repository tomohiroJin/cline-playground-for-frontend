// ゲームコントローラーコンポーネント

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CrosshairIcon } from './ControllerIcons';
import { ControlsContainer, ControlBtn } from '../../../pages/FallingShooterPage.styles';

interface GameControllerProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onFire: () => void;
}

/** ゲーミングコントローラー風の操作ボタン */
export const GameController: React.FC<GameControllerProps> = ({
  onMoveLeft,
  onMoveRight,
  onFire,
}) => (
  <ControlsContainer>
    <ControlBtn onClick={onMoveLeft} aria-label="左に移動">
      <ChevronLeftIcon />
    </ControlBtn>
    <ControlBtn onClick={onFire} $variant="fire" aria-label="射撃">
      <CrosshairIcon />
    </ControlBtn>
    <ControlBtn onClick={onMoveRight} aria-label="右に移動">
      <ChevronRightIcon />
    </ControlBtn>
  </ControlsContainer>
);
