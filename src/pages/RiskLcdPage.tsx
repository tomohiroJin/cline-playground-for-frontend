import React from 'react';
import styled from 'styled-components';
import { RiskLcdGame } from '../features/risk-lcd';

// 全画面背景を暗くして筐体を映える表示にする
const FullScreenWrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  background: #141414;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
`;

// RISK LCD ページラッパーコンポーネント
const RiskLcdPage: React.FC = () => (
  <FullScreenWrap>
    <RiskLcdGame />
  </FullScreenWrap>
);

export default RiskLcdPage;
