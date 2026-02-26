// ポーズ画面コンポーネント

import React from 'react';
import {
  OverlayContainer,
  OverlayContent,
  OverlayTitle,
  OverlayText,
  Button,
} from '../../../pages/FallingShooterPage.styles';

interface PauseOverlayProps {
  onResume: () => void;
  onTitle: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onTitle }) => (
  <OverlayContainer>
    <OverlayContent>
      <OverlayTitle $color="#fbbf24">⏸ PAUSED</OverlayTitle>
      <OverlayText>Esc / P キーで再開</OverlayText>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <Button onClick={onResume}>▶ Resume</Button>
        <Button onClick={onTitle} $variant="secondary">
          🏠 Title
        </Button>
      </div>
    </OverlayContent>
  </OverlayContainer>
);
