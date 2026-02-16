import React from 'react';
import type { OverlayState } from '../hooks';
import { OverlayWrap, OverlayIcon, OverlayText } from '../styles';

export const Overlay: React.FC<{ overlay: OverlayState }> = ({ overlay }) => (
  <OverlayWrap $visible={overlay.visible}>
    <OverlayIcon>{overlay.icon}</OverlayIcon>
    <OverlayText>{overlay.text}</OverlayText>
  </OverlayWrap>
);
