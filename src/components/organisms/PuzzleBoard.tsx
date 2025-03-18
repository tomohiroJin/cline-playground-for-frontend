import React, { useRef } from "react";
import styled from "styled-components";
import { PuzzlePiece as PuzzlePieceType } from "../../store/atoms";
import PuzzlePiece from "../molecules/PuzzlePiece";
import { formatElapsedTime } from "../../utils/puzzle-utils";

// スタイル付きコンポーネント
const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

const Board = styled.div<{ width: number; height: number }>`
  position: relative;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  touch-action: none; /* タッチデバイスでのスクロールを防止 */
`;

const BoardGrid = styled.div<{ division: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(${(props) => props.division}, 1fr);
  grid-template-rows: repeat(${(props) => props.division}, 1fr);
  pointer-events: none;
`;

const GridCell = styled.div`
  border: 1px dashed rgba(0, 0, 0, 0.1);
`;

const CompletionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 1.5rem;
  z-index: 20;
`;

const CompletionMessage = styled.h2`
  margin-bottom: 20px;
`;

const CompletionTime = styled.p`
  font-size: 1.2rem;
  margin-bottom: 20px;
`;

const RestartButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
`;

const ElapsedTime = styled.div`
  font-size: 0.9rem;
  color: #333;
`;

const HintToggle = styled.button<{ active: boolean }>`
  background-color: ${(props) => (props.active ? "#4caf50" : "#f8f8f8")};
  color: ${(props) => (props.active ? "white" : "#333")};
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;

  &:hover {
    background-color: ${(props) => (props.active ? "#45a049" : "#e8e8e8")};
  }
`;

// プロパティの型定義
interface PuzzleBoardProps {
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
  
  // ピースのドラッグ開始ハンドラ
  const handleDragStart = (pieceId: number) => {
    // スライドパズル方式では使用しない
  };
  
  // ピースのドラッグ終了ハンドラ
  const handleDragEnd = (pieceId: number, row: number, col: number) => {
    // スライドパズル方式では、空白ピースの隣接位置にあるピースのみ移動できる
    if (emptyPosition) {
      const piece = pieces.find(p => p.id === pieceId);
      if (piece && !piece.isEmpty) {
        // ピースの現在位置
        const currentRow = piece.currentPosition.row;
        const currentCol = piece.currentPosition.col;
        
        // 空白ピースの隣接位置かどうかをチェック
        const isAdjacent = 
          (Math.abs(currentRow - emptyPosition.row) === 1 && currentCol === emptyPosition.col) ||
          (Math.abs(currentCol - emptyPosition.col) === 1 && currentRow === emptyPosition.row);
        
        if (isAdjacent) {
          // 空白ピースの位置に移動
          onPieceMove(pieceId, emptyPosition.row, emptyPosition.col);
        }
      }
    }
  };
  
  // グリッドセルを生成
  const renderGridCells = () => {
    const cells = [];
    for (let i = 0; i < division * division; i++) {
      cells.push(<GridCell key={i} />);
    }
    return cells;
  };
  
  return (
    <BoardContainer>
      <Board width={boardWidth} height={boardHeight} ref={boardRef}>
        {/* グリッド線 */}
        <BoardGrid division={division}>{renderGridCells()}</BoardGrid>
        
        {/* パズルピース */}
        {pieces.map((piece) => (
          <PuzzlePiece
            key={piece.id}
            piece={piece}
            imageUrl={imageUrl}
            originalWidth={originalWidth}
            originalHeight={originalHeight}
            pieceWidth={pieceWidth}
            pieceHeight={pieceHeight}
            division={division}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            boardRef={boardRef}
          />
        ))}
        
        {/* 完成時のオーバーレイ */}
        {completed && (
          <CompletionOverlay>
            <CompletionMessage>パズル完成！</CompletionMessage>
            <CompletionTime>
              所要時間: {formatElapsedTime(elapsedTime)}
            </CompletionTime>
            <RestartButton onClick={onReset}>もう一度挑戦</RestartButton>
          </CompletionOverlay>
        )}
        
        {/* ヒントモード（背景に元の画像を薄く表示） */}
        {hintMode && !completed && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: "cover",
              opacity: 0.3,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}
      </Board>
      
      <StatusBar>
        <ElapsedTime>経過時間: {formatElapsedTime(elapsedTime)}</ElapsedTime>
        <HintToggle active={hintMode} onClick={onToggleHint}>
          {hintMode ? "ヒントを隠す" : "ヒントを表示"}
        </HintToggle>
      </StatusBar>
    </BoardContainer>
  );
};

export default PuzzleBoard;
