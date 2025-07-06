import React, { useRef, useCallback, useEffect } from 'react';

import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';
import PuzzlePiece from '../molecules/PuzzlePiece';
import { formatElapsedTime } from '../../utils/puzzle-utils';
import { useCompletionOverlay } from '../../hooks/useCompletionOverlay';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { addClearHistory, extractImageName } from '../../utils/storage-utils';

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
 * @param onEndGame - ゲームを終了して設定に戻る関数
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
  onEndGame?: () => void; // ゲームを終了して設定に戻る関数
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
  onEndGame,
}) => {
  // 完成オーバーレイの表示/非表示を管理
  const { overlayVisible, toggleOverlay } = useCompletionOverlay();

  // パズル完成時にクリア履歴を保存
  useEffect(() => {
    if (completed) {
      const imageName = extractImageName(imageUrl);
      addClearHistory(imageName, elapsedTime);
    }
  }, [completed, imageUrl, elapsedTime]);

  // 動画再生の状態と操作を管理
  const {
    videoPlaybackEnabled,
    videoUrl,
    enableVideoPlayback,
    disableVideoPlayback,
    getVideoUrlFromImage,
    setVideo,
  } = useVideoPlayback();

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
    <div className="flex flex-col items-center mb-5">
      <div
        ref={boardRef}
        className="relative bg-gray-100 border-2 border-gray-300 rounded overflow-hidden touch-none"
        style={{ width: boardWidth, height: boardHeight }}
      >
        <div
          title="ボードグリッド"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${division}, 1fr)`,
            gridTemplateRows: `repeat(${division}, 1fr)`,
            pointerEvents: 'none',
          }}
        >
          {renderGridCells}
        </div>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white text-xl z-20 cursor-pointer">
            <h2 className="mb-5">パズル完成！</h2>
            <p className="text-lg mb-5">所要時間: {formatElapsedTime(elapsedTime)}</p>
            <button
              className="bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600"
              onClick={onReset}
            >
              もう一度挑戦
            </button>
            {onEndGame && (
              <button
                className="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 mt-2"
                onClick={onEndGame}
              >
                設定に戻る
              </button>
            )}
          </div>
        )}

        {completed && !overlayVisible && (
          <div
            className="absolute inset-0 cursor-pointer z-10"
            onClick={() => {
              const videoUrl = getVideoUrlFromImage(imageUrl);
              if (videoUrl) {
                setVideo(videoUrl);
              }
            }}
          />
        )}

        {videoPlaybackEnabled && videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
            <video
              src={videoUrl}
              autoPlay
              controls
              onEnded={disableVideoPlayback}
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-2 left-2 bg-white/70 w-9 h-9 flex items-center justify-center rounded-full border"
              onClick={disableVideoPlayback}
              title="動画を閉じる"
            >
              ✕
            </button>
          </div>
        )}
        {completed && (
          <button
            className={`absolute top-2 right-2 w-9 h-9 rounded-full border flex items-center justify-center bg-white/70 z-30`}
            onClick={toggleOverlay}
            title={overlayVisible ? 'オーバーレイを非表示' : 'オーバーレイを表示'}
          >
            <span>{overlayVisible ? '👁️' : '👁️‍🗨️'}</span>
          </button>
        )}
        {hintMode && !completed && (
          <div
            title="ヒント画像"
            className="absolute inset-0 opacity-30 pointer-events-none z-0"
            style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: '100% 100%' }}
          />
        )}
      </div>
      <div className="flex justify-between w-full mt-2 p-2 bg-gray-100 rounded">
        <div className="text-sm text-gray-800">経過時間: {formatElapsedTime(elapsedTime)}</div>
        <button
          className={`px-2 py-1 border rounded text-sm ${hintMode ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={onToggleHint}
        >
          {hintMode ? 'ヒントを隠す' : 'ヒントを表示'}
        </button>
      </div>
    </div>
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
    <div
      title="ボードセル"
      key={i}
      className={completed ? '' : 'border border-dashed border-black/10'}
    />
  ));

export default PuzzleBoard;
