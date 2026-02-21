import styled, { keyframes } from 'styled-components';

export const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

export const Board = styled.div<{ width: number; height: number; $completed?: boolean }>`
  position: relative;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: ${props => (props.$completed ? 'transparent' : '#f0f0f0')};
  border: 2px solid ${props => (props.$completed ? 'transparent' : '#ccc')};
  border-radius: ${props => (props.$completed ? '0' : '4px')};
  overflow: hidden;
  touch-action: none; /* タッチデバイスでのスクロールを防止 */
`;

export const BoardGrid = styled.div<{ division: number; $completed?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(${props => props.division}, 1fr);
  grid-template-rows: repeat(${props => props.division}, 1fr);
  pointer-events: none;
`;

export const GridCell = styled.div<{ $completed?: boolean }>`
  border: ${props => (props.$completed ? 'none' : '1px dashed rgba(0, 0, 0, 0.1)')};
`;

export const StatusBar = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  margin-top: 10px;
  padding: 8px 10px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  gap: 4px;
`;

export const StatusItem = styled.div`
  font-size: 0.9rem;
  color: var(--text-primary);
  text-align: center;
  white-space: nowrap;
`;

export const HintToggleButton = styled.button<{ active: string }>`
  background-color: ${props => (props.active === 'true' ? 'var(--accent-color)' : 'var(--glass-bg)')};
  color: ${props => (props.active === 'true' ? '#fff' : 'var(--text-primary)')};
  padding: 8px 16px;
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  margin-top: 8px;
  width: 100%;

  &:hover {
    background-color: ${props => (props.active === 'true' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.1)')};
    filter: ${props => (props.active === 'true' ? 'brightness(1.1)' : 'none')};
  }
`;

export const HintImage = styled.div<{ $imageUrl: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$imageUrl});
  background-size: 100% 100%;
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
`;

export const OverlayToggleButton = styled.button<{ active: string }>`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.7);
  color: #333;
  width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 30;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;

export const EyeIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`;

export const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 30;
`;

export const VideoPlayer = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px; /* 右上から左上に変更 */
  background-color: rgba(255, 255, 255, 0.7);
  color: #333;
  width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 40;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;

const completeImageFadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const CompleteImage = styled.div<{ $imageUrl: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$imageUrl});
  background-size: 100% 100%;
  z-index: 3;
  animation: ${completeImageFadeIn} 0.5s ease-out 1.5s both;
  pointer-events: none;
`;

const confettiFall = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(200px) rotate(720deg);
  }
`;

export const ConfettiContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 15;
`;

export const ConfettiPiece = styled.div<{
  $left: number;
  $delay: number;
  $duration: number;
  $color: string;
  $size: number;
}>`
  position: absolute;
  top: -10px;
  left: ${props => props.$left}%;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background-color: ${props => props.$color};
  animation: ${confettiFall} ${props => props.$duration}s ease-out ${props => props.$delay}s forwards;
  border-radius: ${props => (props.$size > 6 ? '2px' : '50%')};
`;
