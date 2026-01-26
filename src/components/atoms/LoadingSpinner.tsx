import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div<{ $hasMessage: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: ${({ $hasMessage }) => ($hasMessage ? '2rem' : '0')};

  background: ${({ $hasMessage }) => ($hasMessage ? 'var(--glass-bg)' : 'transparent')};
  backdrop-filter: ${({ $hasMessage }) => ($hasMessage ? 'blur(10px)' : 'none')};
  border: ${({ $hasMessage }) => ($hasMessage ? '1px solid var(--glass-border)' : 'none')};
  box-shadow: ${({ $hasMessage }) => ($hasMessage ? 'var(--glass-shadow)' : 'none')};
  border-radius: 16px;
`;

// Sizes map
const SIZES = {
  small: '24px',
  medium: '48px',
  large: '72px',
};

const Spinner = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  width: ${({ $size }) => SIZES[$size]};
  height: ${({ $size }) => SIZES[$size]};
  border: 4px solid var(--glass-border); /* Slightly visible track */
  border-left-color: var(--accent-color);
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

const Message = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', message }) => {
  return (
    <Container $hasMessage={!!message} role="status" aria-live="polite" aria-busy="true">
      <Spinner $size={size} aria-hidden="true" />
      {message && <Message>{message}</Message>}
    </Container>
  );
};

export default LoadingSpinner;
