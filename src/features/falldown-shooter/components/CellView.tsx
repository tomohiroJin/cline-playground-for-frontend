// セル描画コンポーネント

import React from 'react';
import type { PowerType } from '../types';
import { POWER_TYPES } from '../constants';
import { CellWrapper } from '../../../pages/FallingShooterPage.styles';

interface CellProps {
  x: number;
  y: number;
  color: string;
  size: number;
  power?: PowerType | null;
}

export const CellComponent: React.FC<CellProps> = React.memo(({ x, y, color, size, power }) => {
  const p = power ? POWER_TYPES[power] : null;
  return (
    <CellWrapper $x={x} $y={y} $size={size} $color={p?.color || color} $hasPower={!!p}>
      {p?.icon}
    </CellWrapper>
  );
});
CellComponent.displayName = 'CellComponent';
