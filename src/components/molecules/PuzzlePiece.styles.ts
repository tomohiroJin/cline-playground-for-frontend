import styled, { keyframes, css } from 'styled-components';

const correctFlash = keyframes`
  0% {
    border-color: #4caf50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.8);
  }
  100% {
    border-color: #fff;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  }
`;

export const PieceContainer = styled.div<{
  $isEmpty: boolean;
  $isDragging: boolean;
  $width: number;
  $height: number;
  $completed: boolean;
  $justBecameCorrect?: boolean;
  $dissolveDelay?: number;
}>`
  position: absolute;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  cursor: ${props => (props.$isEmpty ? 'default' : 'pointer')};
  border: 2px solid ${props => (props.$isEmpty || props.$completed ? 'transparent' : '#fff')};
  box-shadow: ${props =>
    props.$isEmpty || props.$completed ? 'none' : '0 0 5px rgba(0, 0, 0, 0.3)'};
  transition: transform 0.2s, background-color 0.5s,
    border-color ${props => (props.$completed ? '0.5s' : '0s')} ease-out
      ${props => (props.$completed && props.$dissolveDelay ? `${props.$dissolveDelay}s` : '0s')},
    box-shadow ${props => (props.$completed ? '0.5s' : '0s')} ease-out
      ${props => (props.$completed && props.$dissolveDelay ? `${props.$dissolveDelay}s` : '0s')};
  z-index: 1;
  user-select: none;
  overflow: hidden;
  touch-action: none; /* タッチデバイスでのスクロールを防止 */
  background-color: ${props => (!props.$completed && props.$isEmpty ? 'transparent' : 'initial')};

  ${props =>
    props.$justBecameCorrect &&
    !props.$isEmpty &&
    !props.$completed &&
    css`
      animation: ${correctFlash} 0.5s ease-out;
    `}

  &:hover {
    ${props =>
      !props.$isEmpty &&
      `
      transform: scale(1.02);
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
      z-index: 2;
    `}
  }
`;

export const PieceImage = styled.div<{
  $imageUrl: string;
  $originalWidth: number;
  $originalHeight: number;
  $row: number;
  $col: number;
  $division: number;
}>`
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$imageUrl});
  background-size: ${props => props.$division * 100}% ${props => props.$division * 100}%;
  background-position: ${props => `-${props.$col * 100}% -${props.$row * 100}%`};
`;
