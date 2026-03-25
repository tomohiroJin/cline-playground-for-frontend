// ============================================================================
// Deep Sea Interceptor - スタイル定義
// ============================================================================

import styled, { keyframes, css, createGlobalStyle } from 'styled-components';

/** 画面振動アニメーション */
const shakeAnimation = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-3px, 2px); }
  50% { transform: translate(3px, -2px); }
  75% { transform: translate(-2px, -3px); }
`;

export const StyledGameContainer = styled.div<{ $shake?: boolean }>`
  width: 800px;
  height: 1000px;
  max-width: 100vw;
  max-height: 100vh;
  aspect-ratio: 4 / 5;
  background: #000;
  position: relative;
  overflow: hidden;
  font-family: sans-serif;
  box-shadow: 0 0 20px rgba(0, 100, 200, 0.3);
  user-select: none;
  touch-action: none;
  ${props => props.$shake && css`animation: ${shakeAnimation} 0.1s linear infinite;`}

  /* レスポンシブスケーリング */
  @media (max-width: 800px) {
    width: 100vw;
    height: auto;
  }
  @media (max-height: 1000px) and (min-width: 800px) {
    height: 100vh;
    width: auto;
  }
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
  font-size: 48px;
  font-weight: bold;
  text-shadow: 0 0 20px #0af;
  margin: 0 0 12px;
`;

export const GameSubTitle = styled.p`
  font-size: 18px;
  opacity: 0.7;
  margin: 0 0 40px;
`;

export const InfoBox = styled.div`
  background: rgba(0, 30, 60, 0.6);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 30px;
  font-size: 16px;
  line-height: 1.8;
  width: 80%;
`;

export const Button = styled.button<{ $primary?: boolean }>`
  padding: 18px 60px;
  font-size: 22px;
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

/** グローバルアニメーション定義（WARNING演出等） */
export const GameGlobalStyles = createGlobalStyle`
  @keyframes warningPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
  }
  @keyframes warningBorder {
    0%, 100% { border-color: rgba(255,0,0,0.5); }
    50% { border-color: rgba(255,0,0,0.1); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;
