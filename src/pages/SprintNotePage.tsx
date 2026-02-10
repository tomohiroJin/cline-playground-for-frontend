import React from 'react';
import styled from 'styled-components';
import { SprintNoteGame } from '../features/sprint-note';

// 全画面背景ラッパー
const FullScreenWrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
  background: #0f1117;
`;

// Sprint Note ページラッパーコンポーネント
const SprintNotePage: React.FC = () => (
  <FullScreenWrap>
    <SprintNoteGame />
  </FullScreenWrap>
);

export default SprintNotePage;
