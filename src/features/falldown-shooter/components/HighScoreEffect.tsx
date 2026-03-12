// ハイスコア更新演出コンポーネント

import React from 'react';
import styled, { keyframes } from 'styled-components';

interface HighScoreEffectProps {
  show: boolean;
}

const shine = keyframes`
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const sparkle = keyframes`
  0%, 100% { text-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700; }
  50% { text-shadow: 0 0 20px #ffd700, 0 0 40px #ff8c00, 0 0 60px #ffd700; }
`;

const Container = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 15;
  text-align: center;
  animation: ${shine} 0.5s ease-out;
  pointer-events: none;
`;

const Text = styled.div`
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffd700;
  animation: ${sparkle} 1s ease-in-out infinite;
  letter-spacing: 3px;
  text-transform: uppercase;
`;

/** ハイスコア更新時の金色演出コンポーネント */
export const HighScoreEffect: React.FC<HighScoreEffectProps> = ({ show }) => {
  if (!show) return null;

  return (
    <Container>
      <Text>NEW HIGH SCORE!</Text>
    </Container>
  );
};
