import { useRef, useEffect, useCallback } from 'react';
import {
  BoardContainer,
  Board,
  BoardGrid,
  GridCell,
  StatusBar,
  StatusItem,
  HintToggleButton,
  HintImage,
  OverlayToggleButton,
  EyeIcon,
  CompleteImage,
} from './PuzzleBoard.styles';
import { PuzzlePiece as PuzzlePieceType, PuzzleScore } from '../../types/puzzle';
import PuzzlePiece from '../molecules/PuzzlePiece';
import { formatElapsedTime } from '../../shared/utils/format';
import { useCompletionOverlay } from '../../presentation/hooks/useCompletionOverlay';
import { useVideoPlayback } from '../../presentation/hooks/useVideoPlayback';
import { addClearHistory } from '../../utils/storage/clearHistory';
import { extractImageName } from '../../shared/utils/image-utils';
import ResultScreen from '../molecules/ResultScreen';
import { useSwipe } from '../../presentation/hooks/useSwipe';
import { useKeyboard } from '../../presentation/hooks/useKeyboard';
import VideoOverlay from './VideoOverlay';
import ConfettiOverlay from './ConfettiOverlay';

/**
 * パズルボードコンポーネントのプロパティの型定義
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
  moveCount: number;
  correctRate: number;
  score: PuzzleScore | null;
  isBestScore: boolean;
  onPieceMove: (pieceId: number, row: number, col: number) => void;
  onReset: () => void;
  onToggleHint: () => void;
  onEmptyPanelClick?: () => void;
  onEndGame?: () => void;
};

type Direction = 'up' | 'down' | 'left' | 'right';

const DIRECTION_DELTAS: Record<Direction, { rowDelta: number; colDelta: number }> = {
  up: { rowDelta: 1, colDelta: 0 },
  down: { rowDelta: -1, colDelta: 0 },
  left: { rowDelta: 0, colDelta: 1 },
  right: { rowDelta: 0, colDelta: -1 },
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
  moveCount,
  correctRate,
  score,
  isBestScore,
  onPieceMove,
  onReset,
  onToggleHint,
  onEmptyPanelClick,
  onEndGame,
}) => {
  // 完成オーバーレイの表示/非表示を管理
  const { overlayVisible, toggleOverlay } = useCompletionOverlay();

  // パズル完成時にクリア履歴を保存
  const prevCompletedRef = useRef(false);
  useEffect(() => {
    if (completed) {
      const imageName = extractImageName(imageUrl);
      addClearHistory(imageName, elapsedTime);
    }
    prevCompletedRef.current = completed;
  }, [completed, imageUrl, elapsedTime]);

  // 動画再生の状態と操作を管理
  const { videoPlaybackEnabled, videoUrl, disableVideoPlayback, getVideoUrlFromImage, setVideo } =
    useVideoPlayback();

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

  // 方向指定でピースを移動する（スワイプ・キーボード用）
  const handleDirectionMove = useCallback(
    (direction: Direction) => {
      if (completed || !emptyPosition) return;

      const delta = DIRECTION_DELTAS[direction];
      const targetRow = emptyPosition.row + delta.rowDelta;
      const targetCol = emptyPosition.col + delta.colDelta;

      const targetPiece = pieces.find(
        p =>
          !p.isEmpty &&
          p.currentPosition.row === targetRow &&
          p.currentPosition.col === targetCol
      );

      if (targetPiece) {
        onPieceMove(targetPiece.id, emptyPosition.row, emptyPosition.col);
      }
    },
    [completed, emptyPosition, pieces, onPieceMove]
  );

  // スワイプ
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(handleDirectionMove);

  // キーボード
  useKeyboard({
    onMove: handleDirectionMove,
    onToggleHint: onToggleHint,
    onReset: onReset,
    enabled: !completed,
  });

  // グリッドセルを生成
  const renderGridCells = createGridCells(division, completed);

  return (
    <BoardContainer>
      <Board
        width={boardWidth}
        height={boardHeight}
        $completed={completed}
        ref={boardRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
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
            dissolveDelay={
              completed
                ? calculateDissolveDelay(
                    piece.correctPosition.row,
                    piece.correctPosition.col,
                    division
                  )
                : 0
            }
          />
        ))}
        {completed && <CompleteImage $imageUrl={imageUrl} />}
        <ConfettiOverlay completed={completed} />
        {completed && overlayVisible && score && (
          <ResultScreen
            imageAlt={extractImageName(imageUrl)}
            division={division}
            score={score}
            isBestScore={isBestScore}
            onRetry={onReset}
            onBackToSetup={onEndGame ?? (() => {})}
          />
        )}

        {completed && !overlayVisible && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 10,
            }}
            onClick={() => {
              const videoUrl = getVideoUrlFromImage(imageUrl);
              if (videoUrl) {
                setVideo(videoUrl);
              }
            }}
          />
        )}

        {videoPlaybackEnabled && videoUrl && (
          <VideoOverlay videoUrl={videoUrl} onClose={disableVideoPlayback} />
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
        <StatusItem>⏱ {formatElapsedTime(elapsedTime)}</StatusItem>
        <StatusItem>👣 {moveCount}手</StatusItem>
        <StatusItem>📊 正解率 {correctRate}%</StatusItem>
      </StatusBar>
      <HintToggleButton active={hintMode ? 'true' : 'false'} onClick={onToggleHint}>
        {hintMode ? 'ヒントを隠す' : 'ヒントを表示'}
      </HintToggleButton>
    </BoardContainer>
  );
};

/**
 * ボードとピースのサイズを計算する関数
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
 */
const createGridCells = (division: number, completed: boolean) =>
  Array.from({ length: division * division }, (_, i) => (
    <GridCell title="ボードセル" key={i} $completed={completed} />
  ));

/**
 * ピースの位置から中心までの距離に基づいてボーダー溶解のディレイを計算する
 */
const calculateDissolveDelay = (row: number, col: number, division: number): number => {
  const center = (division - 1) / 2;
  const distance = Math.max(Math.abs(row - center), Math.abs(col - center));
  const maxDistance = Math.ceil(center);
  if (maxDistance === 0) return 0;
  return ((maxDistance - distance) / maxDistance) * 1.0;
};

export default PuzzleBoard;
