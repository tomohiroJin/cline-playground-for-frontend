import React from 'react';
import styled from 'styled-components';
import { KeysAndArmsGame } from '../features/keys-and-arms';

const PageWrap = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  background: #101010;
`;

const KeysAndArmsPage: React.FC = () => (
  <PageWrap>
    <KeysAndArmsGame />
  </PageWrap>
);

export default KeysAndArmsPage;
