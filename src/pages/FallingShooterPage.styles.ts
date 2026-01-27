import styled, { keyframes, css } from 'styled-components';

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(to bottom, #111827, #312e81);
  padding: 0.5rem;
  font-family: 'Inter', sans-serif;
  color: white;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

export const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
`;

export const IconButton = styled.button`
  padding: 0.125rem 0.5rem;
  background-color: #374151;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4b5563;
  }
`;

export const GameArea = styled.div<{ $width: number; $height: number }>`
  position: relative;
  background-color: #1f2937;
  border: 4px solid #6366f1;
  border-radius: 0.5rem;
  overflow: hidden;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
`;

export const CellWrapper = styled.div<{
  $x: number;
  $y: number;
  $size: number;
  $color: string;
  $hasPower: boolean;
}>`
  position: absolute;
  left: ${props => props.$x * props.$size}px;
  top: ${props => props.$y * props.$size}px;
  width: ${props => props.$size - 1}px;
  height: ${props => props.$size - 1}px;
  background-color: ${props => props.$color};
  border: 1px solid #4b5563;
  border-radius: 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  ${props =>
    props.$hasPower &&
    css`
      box-shadow: 0 0 8px ${props.$color};
    `}
`;

export const BulletWrapper = styled.div<{
  $x: number;
  $y: number;
  $size: number;
  $color: string;
  $pierce: boolean;
  $downshot: boolean;
}>`
  position: absolute;
  left: ${props => props.$x * props.$size + props.$size / 2 - 3}px;
  top: ${props => props.$y * props.$size + props.$size / 2 - 5}px;
  width: 6px;
  height: ${props => (props.$pierce ? 14 : 10)}px;
  background-color: ${props => props.$color};
  border-radius: 9999px;
  box-shadow: 0 0 6px ${props => props.$color};
  transform: ${props => (props.$downshot ? 'rotate(180deg)' : 'none')};
`;

export const PlayerWrapper = styled.div<{ $x: number; $y: number; $size: number }>`
  position: absolute;
  left: ${props => props.$x * props.$size}px;
  top: ${props => props.$y * props.$size}px;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  z-index: 10;
  filter: drop-shadow(0 0 4px cyan);
`;

export const OverlayContainer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
`;

export const OverlayContent = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
`;

export const OverlayTitle = styled.h2<{ $color?: string }>`
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${props => props.$color || 'white'};
`;

export const OverlayText = styled.p<{ $color?: string }>`
  font-size: 0.875rem;
  color: ${props => props.$color || '#d1d5db'};
  margin-bottom: 0.5rem;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.375rem 1rem;
  border-radius: 0.25rem;
  font-weight: 700;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  ${props =>
    props.$variant === 'secondary'
      ? css`
          background-color: #4b5563;
          &:hover {
            background-color: #6b7280;
          }
        `
      : css`
          background-color: #16a34a;
          &:hover {
            background-color: #22c55e;
          }
        `}
`;

export const ControlsContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

export const ControlBtn = styled.button<{ $variant?: 'fire' | 'default' }>`
  border-radius: 0.75rem;
  font-weight: 700;
  color: white;
  border: none;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: transform 0.1s;

  &:active {
    transform: scale(0.95);
  }

  ${props =>
    props.$variant === 'fire'
      ? css`
          background-color: #dc2626;
          padding: 1rem 2rem;
          font-size: 1.5rem;
          min-width: 100px;
          &:active {
            background-color: #b91c1c;
          }
        `
      : css`
          background-color: #374151;
          padding: 1rem 1.5rem;
          font-size: 1.875rem;
          min-width: 70px;
          &:active {
            background-color: #4b5563;
          }
        `}
`;

export const DangerLine = styled.div<{ $top: number }>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${props => props.$top}px;
  border-top: 2px dashed #ef4444;
  opacity: 0.5;
`;

export const Effect = styled.div`
  position: absolute;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
`;

const ping = keyframes`
  75%, 100% { transform: scale(2); opacity: 0; }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
`;

export const Laser = styled(Effect)<{ $x: number; $height: number; $size: number }>`
  left: ${props => props.$x * props.$size}px;
  top: 0;
  width: ${props => props.$size}px;
  height: ${props => props.$height}px;
  background-color: rgba(255, 215, 0, 0.7);
  box-shadow: 0 0 20px #ffd700;
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

export const Explosion = styled(Effect)<{ $x: number; $y: number; $size: number }>`
  border-radius: 9999px;
  left: ${props => (props.$x - 1) * props.$size}px;
  top: ${props => (props.$y - 1) * props.$size}px;
  width: ${props => props.$size * 3}px;
  height: ${props => props.$size * 3}px;
  background-color: rgba(255, 100, 0, 0.5);
  animation: ${ping} 1s cubic-bezier(0, 0, 0.2, 1) infinite;
`;

export const Blast = styled(Effect)`
  inset: 0;
  background-color: rgba(255, 99, 71, 0.5);
  animation: ${ping} 1s cubic-bezier(0, 0, 0.2, 1) infinite;
`;

export const SkillGaugeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const GaugeBar = styled.div`
  width: 8rem;
  height: 1rem;
  background-color: #374151;
  border-radius: 9999px;
  overflow: hidden;
  border: 1px solid #6b7280;
`;

export const GaugeFill = styled.div<{ $width: number; $isFull: boolean }>`
  height: 100%;
  width: ${props => props.$width}%;
  background-color: ${props => (props.$isFull ? '#facc15' : '#3b82f6')};
  transition: all 0.3s;
  ${props =>
    props.$isFull &&
    css`
      animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `}
`;

export const SkillButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const SkillBtn = styled.button<{ $color: string }>`
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background-color: ${props => props.$color};
  min-width: 70px;
  animation: ${bounce} 1s infinite;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.1);
  }
  &:active {
    transform: scale(0.95);
  }
`;

export const PowerIndicator = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
`;

export const PowerBadge = styled.span<{ $color: string }>`
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  background-color: ${props => props.$color};
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

export const StatusBarContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
`;

export const StatusBadge = styled.span<{ $color: string }>`
  background-color: ${props => props.$color};
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
`;

export const DemoContainer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.9);
  cursor: pointer;
`;

export const DemoContent = styled.div`
  text-align: center;
  padding: 1.5rem;
  max-width: 24rem;
`;

export const DemoTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #22d3ee;
  margin-bottom: 1rem;
  animation: ${pulse} 2s infinite;
`;

export const DemoDot = styled.div<{ $active: boolean }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: ${props => (props.$active ? '#22d3ee' : '#4b5563')};
`;
