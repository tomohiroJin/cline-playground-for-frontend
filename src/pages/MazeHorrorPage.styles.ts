import styled, { keyframes, css } from 'styled-components';

export const PageContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #030712, #111827, #000000);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;
  font-family: sans-serif;
`;

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const Canvas = styled.canvas`
  display: block;
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
`;

export const Overlay = styled.div<{ $gradient?: string }>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  background: ${props => props.$gradient || 'rgba(0,0,0,0.8)'};
  animation: ${fadeIn} 0.5s ease-out;
`;

export const TitleContainer = styled.div`
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const TitleMain = styled.h1`
  font-size: 3.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
  text-shadow:
    0 0 40px #dc2626,
    0 0 80px #991b1b;
  color: white;

  @media (min-width: 768px) {
    font-size: 4.5rem;
  }
`;

export const TitleSub = styled.p`
  color: #ef4444;
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  font-weight: 300;
  letter-spacing: 0.1em;
`;

export const TitleJapanese = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 2rem;
`;

export const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 20rem;
`;

export const DiffButton = styled.button<{ $gradientClass: string }>`
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  font-weight: bold;
  font-size: 1.125rem;
  transition: all 0.2s;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid;
  color: white;
  width: 100%;
  text-align: left;

  &:hover {
    transform: scale(1.05);
  }

  ${props => {
    switch (props.$gradientClass) {
      case 'easy':
        return css`
          background: linear-gradient(to right, #065f46, #047857);
          border-color: rgba(16, 185, 129, 0.3);
        `;
      case 'normal':
        return css`
          background: linear-gradient(to right, #b45309, #d97706);
          border-color: rgba(245, 158, 11, 0.3);
        `;
      case 'hard':
        return css`
          background: linear-gradient(to right, #991b1b, #b91c1c);
          border-color: rgba(239, 68, 68, 0.3);
        `;
      default:
        return '';
    }
  }}
`;

export const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const ButtonInfo = styled.div`
  text-align: right;
  font-size: 0.75rem;
  opacity: 0.7;
  font-weight: normal;
`;

export const StoryText = styled.p<{ $active: boolean }>`
  color: white;
  margin-bottom: 1rem;
  transition: all 0.7s;
  font-size: ${props => (props.$active ? '1.5rem' : '1.125rem')};
  opacity: ${props => (props.$active ? 1 : 0.3)};
  text-shadow: ${props => (props.$active ? '0 0 30px rgba(255,255,255,0.5)' : 'none')};
  text-align: center;
`;

export const HUDContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 10;
  pointer-events: none;
`;

export const HUDGroup = styled.div<{ $align?: 'left' | 'right' }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  align-items: ${props => (props.$align === 'right' ? 'flex-end' : 'flex-start')};
`;

export const HUDPanel = styled.div<{ $borderColor?: string; $bg?: string; $animate?: boolean }>`
  background-color: ${props => props.$bg || 'rgba(0, 0, 0, 0.85)'};
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${props => props.$borderColor || 'rgba(255, 255, 255, 0.2)'};
  ${props =>
    props.$animate &&
    css`
      animation: ${pulse} 1s infinite;
    `}
`;

export const BarContainer = styled.div`
  width: 4rem;
  height: 0.5rem;
  background-color: #1f2937;
  border-radius: 9999px;
  overflow: hidden;
`;

export const BarFill = styled.div<{ $percent: number; $color: string }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background-color: ${props => props.$color};
  transition: width 0.2s;
`;

export const MinimapContainer = styled.div`
  position: absolute;
  bottom: 6rem;
  left: 0.75rem;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 10;

  @media (min-width: 768px) {
    bottom: 2rem;
  }
`;

export const ControlsContainer = styled.div`
  position: absolute;
  bottom: 0.5rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: flex-end;
  z-index: 10;
  padding-bottom: 20px;

  @media (min-width: 768px) {
    bottom: 2rem;
  }
`;

export const DPadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
`;

export const ControlBtn = styled.button<{
  $active?: boolean;
  $variant?: 'dpad' | 'action' | 'shift';
}>`
  background-color: rgba(31, 41, 55, 0.95);
  border-radius: 0.75rem;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none;
  cursor: pointer;

  &:active {
    background-color: #4b5563;
  }

  ${props =>
    props.$variant === 'dpad' &&
    css`
      width: 3.5rem;
      height: 3.5rem;
      font-size: 1.5rem;
    `}

  ${props =>
    props.$variant === 'shift' &&
    css`
      width: 5rem;
      height: 2.5rem;
      font-size: 0.875rem;
      font-weight: bold;
    `}
  
  ${props =>
    props.$variant === 'action' &&
    css`
      width: 5rem;
      height: 3.5rem;
      flex-direction: column;
    `}
`;

export const Modal = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ModalContent = styled.div`
  background: linear-gradient(to bottom right, #111827, #1f2937);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 28rem;
  width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const MessageOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s;
  pointer-events: none;
`;

export const DemoDots = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const DemoDot = styled.div<{ $active: boolean }>`
  height: 0.5rem;
  border-radius: 9999px;
  transition: all 0.3s;
  background-color: ${props => (props.$active ? '#facc15' : '#4b5563')};
  width: ${props => (props.$active ? '1.5rem' : '0.5rem')};
`;

export const HelpPanel = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 20rem;
  text-align: center;
`;

export const HelpGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
`;

export const KeyHelp = styled.div`
  background-color: rgba(31, 41, 55, 0.5);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
