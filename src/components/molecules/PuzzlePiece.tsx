import React, { useEffect, useState } from 'react';
import { PieceContainer, PieceImage } from './PuzzlePiece.styles';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';

// プロパティの型定義
interface PuzzlePieceProps {
  piece: PuzzlePieceType;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  pieceWidth: number;
  pieceHeight: number;
  division: number;
  onClick: (pieceId: number, row: number, col: number) => void;
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
  onClick,
  boardRef,
}) => {
  // 状態
  const [position, setPosition] = useState({
    x: piece.currentPosition.col * pieceWidth,
    y: piece.currentPosition.row * pieceHeight,
  });

  // クリックイベントハンドラ
  const handleClick = () => {
    if (piece.isEmpty) return;

    // 親コンポーネントに通知
    onClick(piece.id, piece.currentPosition.row, piece.currentPosition.col);
  };

  // ピースの位置が変更されたときに状態を更新
  useEffect(() => {
    // 位置を更新
    setPosition({
      x: piece.currentPosition.col * pieceWidth,
      y: piece.currentPosition.row * pieceHeight,
    });
  }, [piece.currentPosition.row, piece.currentPosition.col, pieceWidth, pieceHeight]);

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
      {!piece.isEmpty && (
        <PieceImage
          $imageUrl={imageUrl}
          $originalWidth={originalWidth}
          $originalHeight={originalHeight}
          $row={piece.correctPosition.row}
          $col={piece.correctPosition.col}
          $division={division}
        />
      )}
    </PieceContainer>
  );
};

export default PuzzlePiece;
