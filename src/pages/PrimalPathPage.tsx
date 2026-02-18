import React from 'react';
import styled from 'styled-components';
import { PrimalPathGame } from '../features/primal-path';

const FullScreenWrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  background: #0a0a12;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
`;

const PrimalPathPage: React.FC = () => (
  <FullScreenWrap>
    <PrimalPathGame />
  </FullScreenWrap>
);

export default PrimalPathPage;
