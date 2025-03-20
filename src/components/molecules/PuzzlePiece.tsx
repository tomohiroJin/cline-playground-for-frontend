import React, { useRef } from 'react';
import styled from 'styled-components';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';

// スタイル付きコンポーネント
const PieceContainer = styled.div<{
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

const PieceImage = styled.div<{
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

// プロパティの型定義
interface PuzzlePieceProps {
  piece: PuzzlePieceType;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  pieceWidth: number;
  pieceHeight: number;
  division: number;
  onDragStart: (pieceId: number) => void;
  onDragEnd: (pieceId: number, row: number, col: number) => void;
  boardRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * パズルのピースコンポーネント
 */
const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  imageUrl,
  originalWidth,
  originalHeight,
  pieceWidth,
  pieceHeight,
  division,
  onDragStart,
  onDragEnd,
  boardRef,
}) => {
  // 状態
  const [position, setPosition] = React.useState({
    x: piece.currentPosition.col * pieceWidth,
    y: piece.currentPosition.row * pieceHeight,
  });

  // クリックイベントハンドラ
  const handleClick = () => {
    if (piece.isEmpty) return;

    // 親コンポーネントに通知
    onDragEnd(piece.id, piece.currentPosition.row, piece.currentPosition.col);
  };

  // ピースの位置が変更されたときに状態を更新
  React.useEffect(() => {
    setPosition({
      x: piece.currentPosition.col * pieceWidth,
      y: piece.currentPosition.row * pieceHeight,
    });
  }, [piece.currentPosition, pieceWidth, pieceHeight]);

  return (
    <PieceContainer
      $isEmpty={piece.isEmpty}
      $isDragging={false}
      $width={pieceWidth}
      $height={pieceHeight}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onClick={handleClick}
    >
      <PieceImage
        $imageUrl={imageUrl}
        $originalWidth={originalWidth}
        $originalHeight={originalHeight}
        $row={piece.correctPosition.row}
        $col={piece.correctPosition.col}
        $division={division}
      />
    </PieceContainer>
  );
};

export default PuzzlePiece;
