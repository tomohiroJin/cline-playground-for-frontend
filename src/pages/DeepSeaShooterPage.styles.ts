import styled, { keyframes, css } from 'styled-components';

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  user-select: none;
`;

export const GameContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 560px;
  background-color: #0a1a2a;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 100, 200, 0.3);

  @media (max-width: 480px) {
    height: 100vh;
    max-width: 100%;
  }
`;

export const CanvasLayer = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

export const StartScreen = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0a1a2a, #020810);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6ac;
  font-family: sans-serif;
  z-index: 10;
`;

export const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 0 20px #0af;
  margin: 0 0 6px;
  letter-spacing: 2px;
`;

export const SubTitle = styled.p`
  font-size: 11px;
  opacity: 0.7;
  margin: 0 0 30px;
  letter-spacing: 4px;
`;

export const InfoBox = styled.div`
  background: rgba(0, 30, 60, 0.6);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 10px;
  line-height: 1.8;
  width: 80%;
  border: 1px solid rgba(100, 200, 255, 0.1);
`;

export const StartButton = styled.button`
  padding: 12px 40px;
  font-size: 14px;
  background: linear-gradient(180deg, #2a6a9a, #1a4a6a);
  border: 2px solid #4a9acf;
  border-radius: 25px;
  color: #fff;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 15px rgba(74, 154, 207, 0.5);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(74, 154, 207, 0.8);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const GameOverContainer = styled(StartScreen)`
  background: linear-gradient(180deg, #1a0a0a, #0a0505);
  color: #a66;
`;

export const GameOverTitle = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #f66;
  text-shadow: 0 0 10px #900;
`;

export const ScoreText = styled.p`
  font-size: 18px;
  margin-bottom: 10px;
  color: #fff;
`;

export const RetryButton = styled(StartButton)`
  background: #633;
  border: 2px solid #966;
  box-shadow: 0 0 15px rgba(200, 50, 50, 0.3);

  &:hover {
    background: #844;
    box-shadow: 0 0 25px rgba(200, 50, 50, 0.6);
  }
`;

export const EndingContainer = styled(StartScreen)`
  background: linear-gradient(180deg, #0a1a2a, #020810);
  background-image: radial-gradient(circle at center, #1a2a4a 0%, #020810 80%);
`;

export const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const HUDText = styled.div<{
  $color?: string;
  $size?: number;
  $top?: number;
  $left?: number;
  $right?: number;
  $opacity?: number;
}>`
  position: absolute;
  top: ${props => props.$top ?? 'auto'}px;
  left: ${props => props.$left ?? 'auto'}px;
  right: ${props => props.$right ?? 'auto'}px;
  color: ${props => props.$color || '#6ac'};
  font-size: ${props => props.$size || 10}px;
  opacity: ${props => props.$opacity || 1};
  font-family: monospace;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
`;

export const PlayerLife = styled.div`
  position: absolute;
  top: 22px;
  right: 8px;
  color: #f66;
  font-size: 12px;
  letter-spacing: 2px;
`;

export const TouchControlsContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 140px;
  display: flex;
  justify-content: space-between;
  padding: 15px;
  pointer-events: none; /* Let clicks pass through to game if needed, but buttons catch them */
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
`;

export const DPadContainer = styled.div`
  position: relative;
  width: 110px;
  height: 110px;
  pointer-events: auto;
`;

export const DPadBack = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(100, 150, 200, 0.1);
  border: 2px solid rgba(100, 150, 200, 0.2);
`;

export const DPadButton = styled.button<{ $left: number; $top: number }>`
  position: absolute;
  left: ${props => props.$left}px;
  top: ${props => props.$top}px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(100, 150, 200, 0.4);
  border: none;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);

  &:active {
    background: rgba(100, 150, 200, 0.8);
  }
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  pointer-events: auto;
  padding-bottom: 10px;
`;

export const ActionButton = styled.button<{ $charging?: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props =>
    props.$charging ? 'rgba(255, 200, 100, 0.8)' : 'rgba(100, 200, 255, 0.5)'};
  border: 2px solid ${props => (props.$charging ? '#fa6' : '#6cf')};
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px
    ${props => (props.$charging ? 'rgba(255, 170, 0, 0.4)' : 'rgba(0, 150, 255, 0.3)')};
  transition: all 0.1s;

  &:active {
    transform: scale(0.95);
    background: ${props =>
      props.$charging ? 'rgba(255, 200, 100, 1)' : 'rgba(100, 200, 255, 0.8)'};
  }
`;

// Helper for sprites (using absolute positioning divs)
export const SpriteDiv = styled.div<{ $x: number; $y: number; $size: number; $rot?: number }>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  transform: translate(-50%, -50%) rotate(${props => props.$rot || 0}rad);
  pointer-events: none;
`;

export const Bullet = styled(SpriteDiv)<{ $isEnemy?: boolean; $charged?: boolean }>`
  background: ${props =>
    props.$isEnemy
      ? 'radial-gradient(circle, #f66, #a33)'
      : props.$charged
        ? 'radial-gradient(circle, #fff, #64c8ff, #06c)'
        : 'radial-gradient(circle, #fff, #64c8ff)'};
  border-radius: 50%;
  box-shadow: 0 0 ${props => (props.$charged ? 15 : 6)}px
    ${props => (props.$isEnemy ? '#f33' : '#64c8ff')};
`;

export const Enemy = styled(SpriteDiv)<{ $color: string; $isBoss?: boolean }>`
  /* SVG inside handles shape */
  opacity: 0.9;
  z-index: 2;
`;

export const Item = styled(SpriteDiv)<{ $color: string }>`
  background: radial-gradient(circle, ${props => props.$color}, ${props => props.$color}88);
  border-radius: 50%;
  box-shadow: 0 0 10px ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 0 3px #000;
  z-index: 3;
`;

export const Particle = styled(SpriteDiv)<{ $color: string; $life: number; $maxLife: number }>`
  background: ${props => props.$color};
  border-radius: 50%;
  opacity: ${props => props.$life / props.$maxLife};
`;

export const ChargeBar = styled.div`
  position: absolute;
  width: 40px;
  height: 4px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  transform: translate(-50%, -100%);
  pointer-events: none;
`;

export const ChargeFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background: ${props => (props.$percent >= 100 ? '#6cf' : '#48a')};
  border-radius: 2px;
`;
