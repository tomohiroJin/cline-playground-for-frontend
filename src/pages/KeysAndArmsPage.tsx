import React from 'react';
import styled from 'styled-components';
import { KeysAndArmsGame } from '../features/keys-and-arms';

const PageWrap = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at 50% 10%, #2a2a2a 0%, #141414 55%, #0f0f0f 100%);
`;

const KeysAndArmsPage: React.FC = () => (
  <PageWrap>
    <KeysAndArmsGame />
  </PageWrap>
);

export default KeysAndArmsPage;
