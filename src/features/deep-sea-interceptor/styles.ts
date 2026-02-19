// ============================================================================
// Deep Sea Interceptor - スタイル定義
// ============================================================================

import styled, { keyframes, css } from 'styled-components';

/** 画面振動アニメーション */
const shakeAnimation = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-3px, 2px); }
  50% { transform: translate(3px, -2px); }
  75% { transform: translate(-2px, -3px); }
`;

export const StyledGameContainer = styled.div<{ $shake?: boolean }>`
  width: 400px;
  height: 560px;
  background: #000;
  position: relative;
  overflow: hidden;
  font-family: sans-serif;
  box-shadow: 0 0 20px rgba(0, 100, 200, 0.3);
  user-select: none;
  touch-action: none;
  ${props => props.$shake && css`animation: ${shakeAnimation} 0.1s linear infinite;`}
`;

export const FullScreenOverlay = styled.div<{ $bg: string }>`
  width: 100%;
  height: 100%;
  background: ${props => props.$bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6ac;
`;

export const GameTitle = styled.h1`
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 0 20px #0af;
  margin: 0 0 6px;
`;

export const GameSubTitle = styled.p`
  font-size: 11px;
  opacity: 0.7;
  margin: 0 0 30px;
`;

export const InfoBox = styled.div`
  background: rgba(0, 30, 60, 0.6);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 10px;
  line-height: 1.8;
  width: 80%;
`;

export const Button = styled.button<{ $primary?: boolean }>`
  padding: 12px 40px;
  font-size: 14px;
  background: ${props => (props.$primary ? 'linear-gradient(180deg,#2a6a9a,#1a4a6a)' : '#633')};
  border: 2px solid ${props => (props.$primary ? '#4a9acf' : '#966')};
  border-radius: 25px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  margin-top: ${props => (props.$primary ? '0' : '15px')};
  &:hover {
    transform: scale(1.05);
  }
`;
