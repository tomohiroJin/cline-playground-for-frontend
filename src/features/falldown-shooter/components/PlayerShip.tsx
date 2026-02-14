// プレイヤー機体コンポーネント

import React from 'react';
import { PlayerWrapper } from '../../../pages/FallingShooterPage.styles';

interface PlayerShipProps {
  x: number;
  y: number;
  size: number;
}

export const PlayerShip: React.FC<PlayerShipProps> = ({ x, y, size }) => (
  <PlayerWrapper $x={x} $y={y} $size={size}>
    <svg viewBox="0 0 40 40" style={{ filter: 'drop-shadow(0 0 4px cyan)' }}>
      <polygon points="20,4 36,36 20,28 4,36" fill="#0FF" stroke="#FFF" strokeWidth="2" />
    </svg>
  </PlayerWrapper>
);
