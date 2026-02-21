import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { SetupSection, StartButton } from '../pages/PuzzlePage.styles';

const titleGlow = keyframes`
  0%, 100% {
    text-shadow:
      0 0 10px rgba(0, 210, 255, 0.4),
      0 0 20px rgba(0, 210, 255, 0.2);
  }
  50% {
    text-shadow:
      0 0 20px rgba(0, 210, 255, 0.8),
      0 0 40px rgba(0, 210, 255, 0.4),
      0 0 60px rgba(0, 210, 255, 0.2);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Title = styled.h1`
  font-size: 2.8rem;
  letter-spacing: 0.3em;
  margin-bottom: 8px;
  animation: ${titleGlow} 3s ease-in-out infinite, ${fadeIn} 0.8s ease-out;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: var(--text-secondary, #aaa);
  margin-top: 0;
  margin-bottom: 16px;
  animation: ${fadeIn} 0.8s ease-out 0.3s both;
`;

const GlowStartButton = styled(StartButton)`
  animation: ${fadeIn} 0.8s ease-out 0.6s both;

  &:hover {
    box-shadow: 0 0 25px rgba(0, 210, 255, 0.6), 0 6px 20px rgba(0, 210, 255, 0.4);
  }
`;

type TitleScreenProps = {
  onStart: () => void;
  onDebugActivate: () => void;
};

const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, onDebugActivate }) => {
  const bufferRef = useRef('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      bufferRef.current = (bufferRef.current + e.key).slice(-3);
      if (bufferRef.current === 'jin') {
        onDebugActivate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDebugActivate]);

  return (
    <SetupSection>
      <Title>ピクチャーパズル</Title>
      <Subtitle>ピースを揃えて絵を完成させよう</Subtitle>
      <GlowStartButton onClick={onStart}>はじめる</GlowStartButton>
    </SetupSection>
  );
};

export default TitleScreen;
