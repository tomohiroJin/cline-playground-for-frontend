// ステータスバーコンポーネント

import React from 'react';
import { StatusBarContainer, StatusBadge } from '../../../pages/FallingShooterPage.styles';

export const StatusBar: React.FC<{
  stage: number;
  lines: number;
  linesNeeded: number;
  score: number;
}> = React.memo(({ stage, lines, linesNeeded, score }) => (
  <StatusBarContainer>
    <StatusBadge $color="#9333ea" aria-live="assertive">ST{stage}</StatusBadge>
    <StatusBadge $color="#16a34a">
      {lines}/{linesNeeded}
    </StatusBadge>
    <StatusBadge $color="#2563eb" aria-live="polite">{score}</StatusBadge>
  </StatusBarContainer>
));
StatusBar.displayName = 'StatusBar';
