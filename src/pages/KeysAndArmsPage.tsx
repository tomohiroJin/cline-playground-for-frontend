import React from 'react';
import styled from 'styled-components';

const PageWrap = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  background: #101010;
`;

const GameFrame = styled.iframe`
  width: min(100%, 980px);
  height: min(calc(100vh - 120px), 920px);
  border: 0;
  border-radius: 12px;
  background: #101010;
`;

const KeysAndArmsPage: React.FC = () => (
  <PageWrap>
    <GameFrame title="KEYS & ARMS" src="/games/keys-and-arms/index.html" />
  </PageWrap>
);

export default KeysAndArmsPage;
