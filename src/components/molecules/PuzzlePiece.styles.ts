import styled from 'styled-components';

export const PieceContainer = styled.div<{
  $isEmpty: boolean;
  $isDragging: boolean;
  $width: number;
  $height: number;
}>`
  position: absolute;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  cursor: ${props => (props.$isEmpty ? 'default' : 'pointer')};
  border: 2px solid ${props => (props.$isEmpty ? 'transparent' : '#fff')};
  box-shadow: ${props => (props.$isEmpty ? 'none' : '0 0 5px rgba(0, 0, 0, 0.3)')};
  transition: all 0.2s;
  z-index: 1;
  user-select: none;
  overflow: hidden;
  touch-action: none; /* タッチデバイスでのスクロールを防止 */
  background-color: ${props => (props.$isEmpty ? '#f0f0f0' : 'transparent')};

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
  background-size: ${props => props.$originalWidth}px ${props => props.$originalHeight}px;
  background-position: ${props =>
    `-${(props.$col * props.$originalWidth) / props.$division}px -${
      (props.$row * props.$originalHeight) / props.$division
    }px`};
`;
