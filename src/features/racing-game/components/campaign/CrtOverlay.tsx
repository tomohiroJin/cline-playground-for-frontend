// CRT スキャンライン演出（spec §6.8.6 / S2 対応）
//
// 全画面 fixed の半透明ストライプで CRT を再現。
// reduced-motion 環境では自動 OFF。
// OPTIONS で ON/OFF できるよう enabled prop で制御。

import React from 'react';
import styled from 'styled-components';

const ScanlineLayer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.0),
    rgba(0, 0, 0, 0.0) 2px,
    rgba(0, 0, 0, 0.18) 3px,
    rgba(0, 0, 0, 0.0) 4px
  );

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

export interface CrtOverlayProps {
  readonly enabled: boolean;
}

export const CrtOverlay: React.FC<CrtOverlayProps> = ({ enabled }) => {
  if (!enabled) return null;
  return <ScanlineLayer aria-hidden="true" data-testid="crt-overlay" />;
};
