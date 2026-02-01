import styled, { keyframes, css } from 'styled-components';

// アニメーション定義
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// ページコンテナ
export const PageContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  padding-top: 80px;
  box-sizing: border-box;
  height: 100dvh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
  font-family: sans-serif;
`;

// オーバーレイ（タイトル/プロローグ/クリア画面用）
export const Overlay = styled.div<{ $bgImage?: string }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  background: ${props =>
    props.$bgImage
      ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${props.$bgImage})`
      : 'rgba(0, 0, 0, 0.85)'};
  background-size: cover;
  background-position: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

// タイトル関連
export const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const TitleMain = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
  background: linear-gradient(to right, #667eea, #764ba2);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 40px rgba(102, 126, 234, 0.5);

  @media (min-width: 768px) {
    font-size: 4rem;
  }
`;

export const TitleSub = styled.p`
  color: #9ca3af;
  font-size: 1rem;
  margin-bottom: 2rem;
`;

export const StartButton = styled.button`
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(to right, #667eea, #764ba2);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  &:active {
    transform: scale(0.98);
  }
`;

// プロローグ関連
export const StoryText = styled.p<{ $active: boolean }>`
  color: white;
  margin-bottom: 1rem;
  transition: all 0.7s;
  font-size: ${props => (props.$active ? '1.5rem' : '1.125rem')};
  opacity: ${props => (props.$active ? 1 : 0.3)};
  text-shadow: ${props => (props.$active ? '0 0 30px rgba(255,255,255,0.5)' : 'none')};
  text-align: center;
  width: 100%;
`;

export const SkipButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// ゲーム画面関連
export const GameRegion = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

export const Canvas = styled.canvas`
  display: block;
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
`;

// モバイル操作用コントロール
export const ControlsContainer = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
  padding: 0 1rem;

  @media (min-width: 768px) {
    bottom: 2rem;
  }
`;

export const ControlButton = styled.button<{ $position: 'left' | 'right' | 'up' | 'down' }>`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: all 0.1s;

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
`;

export const DPadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 4rem);
  grid-template-rows: repeat(3, 4rem);
  gap: 0.25rem;
`;

export const DPadButton = styled.button<{ $direction: 'up' | 'down' | 'left' | 'right' }>`
  width: 4rem;
  height: 4rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: all 0.1s;

  grid-column: ${props => {
    if (props.$direction === 'left') return 1;
    if (props.$direction === 'right') return 3;
    return 2;
  }};

  grid-row: ${props => {
    if (props.$direction === 'up') return 1;
    if (props.$direction === 'down') return 3;
    return 2;
  }};

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.95);
  }
`;

// クリア画面
export const ClearContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const ClearTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: bold;
  color: #fbbf24;
  margin-bottom: 1rem;
  text-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
`;

export const ClearMessage = styled.p`
  color: #e5e7eb;
  font-size: 1.125rem;
  margin-bottom: 2rem;
`;

export const RetryButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(to right, #10b981, #059669);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

export const BackToTitleButton = styled.button`
  padding: 0.75rem 1.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #9ca3af;
  background: transparent;
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(75, 85, 99, 0.3);
    color: white;
  }
`;

// マップ切替ボタン
export const MapToggleButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.5rem;
  color: white;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;
