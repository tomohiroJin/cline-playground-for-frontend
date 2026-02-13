// パワーアップ表示コンポーネント

import React from 'react';
import type { Powers, PowerType } from '../types';
import { POWER_TYPES } from '../constants';
import { PowerIndicator, PowerBadge } from '../../../pages/FallingShooterPage.styles';

export const PowerUpIndicator: React.FC<{ powers: Powers }> = ({ powers }) => {
  const active = (Object.entries(powers) as [PowerType, boolean][]).filter(
    ([k, v]) => v && k !== 'bomb'
  );
  if (!active.length) return null;
  return (
    <PowerIndicator>
      {active.map(([k]) => (
        <PowerBadge key={k} $color={POWER_TYPES[k].color}>
          {POWER_TYPES[k].icon}
        </PowerBadge>
      ))}
    </PowerIndicator>
  );
};
