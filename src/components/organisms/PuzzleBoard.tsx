import React, { useRef } from 'react';
import {
  BoardContainer,
  Board,
  BoardGrid,
  GridCell,
  CompletionOverlay,
  CompletionMessage,
  CompletionTime,
  RestartButton,
  StatusBar,
  ElapsedTime,
  HintToggleButton,
  HintImage,
} from './PuzzleBoard.styles';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';
import PuzzlePiece from '../molecules/PuzzlePiece';
import { formatElapsedTime } from '../../utils/puzzle-utils';

// プロパティの型定義
export interface PuzzleBoardProps {
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  pieces: PuzzlePieceType[];
  division: number;
  elapsedTime: number;
  completed: boolean;
  hintMode: boolean;
  emptyPosition: { row: number; col: number } | null;
  onPieceMove: (pieceId: number, row: number, col: number) => void;
  onReset: () => void;
  onToggleHint: () => void;
}

/**
 * パズルボードコンポーネント
 */
const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  imageUrl,
  originalWidth,
  originalHeight,
  pieces,
  division,
  elapsedTime,
  completed,
  hintMode,
  emptyPosition,
  onPieceMove,
  onReset,
  onToggleHint,
}) => {
  // ボードのサイズを計算
  const maxBoardWidth = 600;
  const aspectRatio = originalHeight / originalWidth;

  const boardWidth = Math.min(maxBoardWidth, originalWidth);
  const boardHeight = boardWidth * aspectRatio;

  // ピースのサイズを計算
  const pieceWidth = boardWidth / division;
  const pieceHeight = boardHeight / division;

  // ボードへの参照
  const boardRef = useRef<HTMLDivElement>(null);

  // ピースをスライドさせる
  const handleSlidePiece = (pieceId: number, row: number, col: number) => {
    // 完成済みの場合は何もしない
    if (completed) return;

    // 空白スペースが存在しなければ処理終了
    if (!emptyPosition) return;

    const piece = pieces.find(p => p.id === pieceId);
    // 対象のピースが存在しない、または空の場合は処理終了
    if (!piece || piece.isEmpty) return;

    // ピースの現在位置
    const currentRow = piece.currentPosition.row;
    const currentCol = piece.currentPosition.col;

    // 空白ピースの隣接位置かどうかをチェック
    const isAdjacent =
      (Math.abs(currentRow - emptyPosition.row) === 1 && currentCol === emptyPosition.col) ||
      (Math.abs(currentCol - emptyPosition.col) === 1 && currentRow === emptyPosition.row);

    // 隣接していなければ処理終了
    if (!isAdjacent) return;

    // 空白ピースの位置に移動
    onPieceMove(pieceId, emptyPosition.row, emptyPosition.col);
  };

  // グリッドセルを生成
  const renderGridCells = Array.from({ length: division * division }, (_, i) => (
    <GridCell title="ボードセル" key={i} />
  ));

  return (
    <BoardContainer>
      <Board width={boardWidth} height={boardHeight} ref={boardRef}>
        {/* グリッド線 */}
        <BoardGrid title="ボードグリッド" division={division}>
          {renderGridCells}
        </BoardGrid>

        {/* パズルピース */}
        {pieces.map(piece => (
          <PuzzlePiece
            key={piece.id}
            piece={piece}
            imageUrl={imageUrl}
            originalWidth={originalWidth}
            originalHeight={originalHeight}
            pieceWidth={pieceWidth}
            pieceHeight={pieceHeight}
            division={division}
            onClick={handleSlidePiece}
            boardRef={boardRef}
            completed={completed}
          />
        ))}

        {/* 完成時のオーバーレイ */}
        {completed && (
          <CompletionOverlay>
            <CompletionMessage>パズル完成！</CompletionMessage>
            <CompletionTime>所要時間: {formatElapsedTime(elapsedTime)}</CompletionTime>
            <RestartButton onClick={onReset}>もう一度挑戦</RestartButton>
          </CompletionOverlay>
        )}

        {/* ヒントモード（背景に元の画像を薄く表示） */}
        {hintMode && !completed && <HintImage $imageUrl={imageUrl} title="ヒント画像" />}
      </Board>

      <StatusBar>
        <ElapsedTime>経過時間: {formatElapsedTime(elapsedTime)}</ElapsedTime>
        <HintToggleButton active={hintMode ? 'true' : 'false'} onClick={onToggleHint}>
          {hintMode ? 'ヒントを隠す' : 'ヒントを表示'}
        </HintToggleButton>
      </StatusBar>
    </BoardContainer>
  );
};

export default PuzzleBoard;
