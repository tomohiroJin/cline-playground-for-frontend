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
  OverlayToggleButton,
  EyeIcon,
} from './PuzzleBoard.styles';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';
import PuzzlePiece from '../molecules/PuzzlePiece';
import { formatElapsedTime } from '../../utils/puzzle-utils';
import { useCompletionOverlay } from '../../hooks/useCompletionOverlay';

/**
 * パズルボードコンポーネントのプロパティの型定義
 *
 * @param imageUrl - 画像のURL
 * @param originalWidth - 元の画像の幅
 * @param originalHeight - 元の画像の高さ
 * @param pieces - パズルのピースの配列
 * @param division - パズルの分割数
 * @param elapsedTime - 経過時間
 * @param completed - ゲームの完了状態
 * @param hintMode - ヒントモードの有効状態
 * @param emptyPosition - 空のピースの位置
 * @param onPieceMove - ピースを移動する関数
 * @param onReset - ゲームをリセットする関数
 * @param onToggleHint - ヒントモードを切り替える関数
 * @param onEmptyPanelClick - 空のパネルをクリックしたときの処理
 */
export type PuzzleBoardProps = {
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
  onEmptyPanelClick?: () => void; // 空白パネルがクリックされたときのコールバック
};

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
  onEmptyPanelClick,
}) => {
  // 完成オーバーレイの表示/非表示を管理
  const { overlayVisible, toggleOverlay } = useCompletionOverlay();

  // ボードのサイズを計算
  const { boardWidth, boardHeight, pieceWidth, pieceHeight } = calculateBoardAndPieceSizes(
    originalWidth,
    originalHeight,
    division
  );

  // ボードへの参照
  const boardRef = useRef<HTMLDivElement>(null);

  // ピースをスライドさせる
  const handleSlidePiece = (pieceId: number) => {
    if (completed || !emptyPosition) return;

    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;

    if (piece.isEmpty) {
      onEmptyPanelClick?.();
      return;
    }

    if (!isAdjacentToEmpty(piece.currentPosition, emptyPosition)) return;

    onPieceMove(pieceId, emptyPosition.row, emptyPosition.col);
  };

  // グリッドセルを生成
  const renderGridCells = createGridCells(division, completed);

  return (
    <BoardContainer>
      <Board width={boardWidth} height={boardHeight} ref={boardRef}>
        <BoardGrid title="ボードグリッド" division={division} $completed={completed}>
          {renderGridCells}
        </BoardGrid>
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
            completed={completed}
          />
        ))}
        {completed && overlayVisible && (
          <CompletionOverlay>
            <CompletionMessage>パズル完成！</CompletionMessage>
            <CompletionTime>所要時間: {formatElapsedTime(elapsedTime)}</CompletionTime>
            <RestartButton onClick={onReset}>もう一度挑戦</RestartButton>
          </CompletionOverlay>
        )}
        {completed && (
          <OverlayToggleButton
            active={overlayVisible ? 'true' : 'false'}
            onClick={toggleOverlay}
            title={overlayVisible ? 'オーバーレイを非表示' : 'オーバーレイを表示'}
          >
            <EyeIcon>{overlayVisible ? '👁️' : '👁️‍🗨️'}</EyeIcon>
          </OverlayToggleButton>
        )}
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

/**
 * ボードとピースのサイズを計算する関数
 *
 * @param originalWidth - 元の画像の幅
 * @param originalHeight - 元の画像の高さ
 * @param division - 分割数
 * @return ボードとピースのサイズを含むオブジェクト
 */
const calculateBoardAndPieceSizes = (
  originalWidth: number,
  originalHeight: number,
  division: number
) => {
  const maxBoardWidth = 600;
  const aspectRatio = originalHeight / originalWidth;
  const boardWidth = Math.min(maxBoardWidth, originalWidth);
  const boardHeight = boardWidth * aspectRatio;
  const pieceWidth = boardWidth / division;
  const pieceHeight = boardHeight / division;
  return { boardWidth, boardHeight, pieceWidth, pieceHeight };
};

/**
 * ピースが空のピースに隣接しているかどうかを判定する関数
 *
 * @param currentPosition - 現在のピースの位置
 * @param emptyPosition - 空のピースの位置
 * @return 隣接している場合はtrue、そうでない場合はfalse
 */
const isAdjacentToEmpty = (
  currentPosition: { row: number; col: number },
  emptyPosition: { row: number; col: number }
) => {
  const { row: currentRow, col: currentCol } = currentPosition;
  const { row: emptyRow, col: emptyCol } = emptyPosition;
  return (
    (Math.abs(currentRow - emptyRow) === 1 && currentCol === emptyCol) ||
    (Math.abs(currentCol - emptyCol) === 1 && currentRow === emptyRow)
  );
};

/**
 * グリッドセルを生成する関数
 *
 * @param division - 分割数
 * @param completed - 完了状態
 * @return グリッドセルの配列
 */
const createGridCells = (division: number, completed: boolean) =>
  Array.from({ length: division * division }, (_, i) => (
    <GridCell title="ボードセル" key={i} $completed={completed} />
  ));

export default PuzzleBoard;
