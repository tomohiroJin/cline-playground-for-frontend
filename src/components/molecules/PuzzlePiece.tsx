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
  completed?: boolean; // パズルが完成したかどうか
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
  completed = false,
}) => {
  /**
   * ピースの位置を計算する関数
   *
   * @param piece - ピースの情報
   * @param pieceWidth - ピースの幅
   * @param pieceHeight - ピースの高さ
   * @returns ピースの位置を表すオブジェクト
   */
  const calculatePosition = (piece: PuzzlePieceType, pieceWidth: number, pieceHeight: number) => ({
    x: piece.currentPosition.col * pieceWidth,
    y: piece.currentPosition.row * pieceHeight,
  });

  /**
   * ピースの位置を計算する
   */
  const [position, setPosition] = useState(calculatePosition(piece, pieceWidth, pieceHeight));

  /**
   * ピースがクリックされたときの処理
   */
  const handleClick = () => onClick(piece.id, piece.currentPosition.row, piece.currentPosition.col);

  /**
   * ピースの位置を更新する
   */
  useEffect(() => {
     
    setPosition(calculatePosition(piece, pieceWidth, pieceHeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece.currentPosition.row, piece.currentPosition.col, pieceWidth, pieceHeight]);

  return (
    <PieceContainer
      $isEmpty={piece.isEmpty}
      $isDragging={false}
      $width={pieceWidth}
      $height={pieceHeight}
      $completed={completed}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onClick={handleClick}
    >
      {/* 空白ピースでも、パズルが完成していれば画像を表示する */}
      {(!piece.isEmpty || completed) && (
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
