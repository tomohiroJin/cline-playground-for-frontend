import React from 'react';

import ImageUploader from '../components/molecules/ImageUploader';
import DefaultImageSelector from '../components/molecules/DefaultImageSelector';
import DifficultySelector from '../components/molecules/DifficultySelector';
import PuzzleBoard from '../components/organisms/PuzzleBoard';
import { PuzzlePiece } from '../store/atoms';

/**
 * SetupSectionコンポーネントのプロパティの型定義
 *
 * @param imageSourceMode - 画像のソースモード（アップロードまたはデフォルト）
 * @param setImageSourceMode - 画像ソースモードを設定する関数
 * @param handleImageUpload - 画像をアップロードする関数
 * @param handleDifficultyChange - 難易度を変更する関数
 * @param handleStartGame - ゲームを開始する関数
 * @param imageUrl - アップロードされた画像のURL
 * @param originalImageSize - 元の画像のサイズ
 * @param division - パズルの分割数
 */
export type SetupSectionProps = {
  imageSourceMode: 'upload' | 'default';
  setImageSourceMode: React.Dispatch<React.SetStateAction<'upload' | 'default'>>;
  handleImageUpload: (url: string, width: number, height: number) => void;
  handleDifficultyChange: (newDivision: number) => void;
  handleStartGame: () => void;
  imageUrl: string | null;
  originalImageSize: { width: number; height: number } | null;
  division: number;
};

/**
 * SetupSectionコンポーネント
 *
 * @param imageSourceMode - 画像のソースモード（アップロードまたはデフォルト）
 * @param setImageSourceMode - 画像ソースモードを設定する関数
 * @param handleImageUpload - 画像をアップロードする関数
 * @param handleDifficultyChange - 難易度を変更する関数
 * @param handleStartGame - ゲームを開始する関数
 * @param imageUrl - アップロードされた画像のURL
 * @param originalImageSize - 元の画像のサイズ
 * @param division - パズルの分割数
 * @returns SetupSectionコンポーネント
 */
export const SetupSectionComponent: React.FC<SetupSectionProps> = ({
  imageSourceMode,
  setImageSourceMode,
  handleImageUpload,
  handleDifficultyChange,
  handleStartGame,
  imageUrl,
  originalImageSize,
  division,
}) => (
  <section className="flex flex-col items-center mb-8 p-5 bg-white rounded-lg shadow w-full max-w-[600px]">
    <div className="flex justify-center mb-5 w-full">
      <button
        className={`px-4 py-2 border text-sm ${imageSourceMode === 'upload' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-800'}`}
        onClick={() => setImageSourceMode('upload')}
      >
        画像をアップロード
      </button>
      <button
        className={`px-4 py-2 border text-sm ${imageSourceMode === 'default' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-800'}`}
        onClick={() => setImageSourceMode('default')}
      >
        デフォルト画像から選択
      </button>
    </div>
    {imageSourceMode === 'upload' ? (
      <ImageUploader onImageUpload={handleImageUpload} maxSizeInMB={10} />
    ) : (
      <DefaultImageSelector onImageSelect={handleImageUpload} />
    )}
    <DifficultySelector value={division} onChange={handleDifficultyChange} disabled={!imageUrl} />
    <button
      className="bg-green-500 text-white py-3 px-6 rounded mt-5 disabled:bg-gray-400"
      onClick={handleStartGame}
      disabled={!imageUrl || !originalImageSize}
    >
      パズルを開始
    </button>
  </section>
);

/**
 * GameSectionコンポーネントのプロパティの型定義
 *
 * - row: 行番号
 * - col: 列番号
 */
export type Position = {
  row: number;
  col: number;
};

/**
 * パズルの完成時の処理を行います。
 *
 * @param pieces - パズルのピースの配列
 * @param setPieces - パズルのピースを設定する関数
 * @param setCompleted - ゲームの完了状態を設定する関数
 */
const completePuzzle = (
  pieces: PuzzlePiece[],
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>,
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const correctPieces = pieces.map(piece => ({
    ...piece,
    currentPosition: { ...piece.correctPosition },
  }));
  setPieces(correctPieces);
  setCompleted(true);
};

/**
 * GameSection コンポーネントのプロパティの型定義
 *
 * @param imageUrl - アップロードされた画像のURL
 * @param originalImageSize - 元の画像のサイズ
 * @param pieces - パズルのピースの配列
 * @param division - パズルの分割数
 * @param elapsedTime - 経過時間
 * @param completed - ゲームの完了状態
 * @param hintModeEnabled - ヒントモードの有効状態
 * @param emptyPosition - 空のピースの位置
 * @param handlePieceMove - ピースを移動する関数
 * @param handleResetGame - ゲームをリセットする関数
 * @param toggleHintMode - ヒントモードを切り替える関数
 * @param handleEmptyPanelClick - 空のパネルをクリックしたときの処理
 * @param handleEndGame - ゲームを終了する関数
 * @param emptyPanelClicks - 空のパネルがクリックされた回数
 * @param setPieces - パズルのピースを設定する関数
 * @param setCompleted - ゲームの完了状態を設定する関数
 */
export type GameSectionProps = {
  imageUrl: string | null;
  originalImageSize: { width: number; height: number } | null;
  pieces: PuzzlePiece[];
  division: number;
  elapsedTime: number;
  completed: boolean;
  hintModeEnabled: boolean;
  emptyPosition: Position;
  handlePieceMove: (pieceId: number, row: number, col: number) => void;
  handleResetGame: () => void;
  toggleHintMode: () => void;
  handleEmptyPanelClick: () => void;
  handleEndGame: () => void;
  emptyPanelClicks: number;
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * GameSection コンポーネント
 *
 * @param imageUrl - アップロードされた画像のURL
 * @param originalImageSize - 元の画像のサイズ
 * @param pieces - パズルのピースの配列
 * @param division - パズルの分割数
 * @param elapsedTime - 経過時間
 * @param completed - ゲームの完了状態
 * @param hintModeEnabled - ヒントモードの有効状態
 * @param emptyPosition - 空のピースの位置
 * @param handlePieceMove - ピースを移動する関数
 * @param handleResetGame - ゲームをリセットする関数
 * @param toggleHintMode - ヒントモードを切り替える関数
 * @param handleEmptyPanelClick - 空のパネルをクリックしたときの処理
 * @param handleEndGame - ゲームを終了する関数
 * @param emptyPanelClicks - 空のパネルがクリックされた回数
 * @param setPieces - パズルのピースを設定する関数
 * @param setCompleted - ゲームの完了状態を設定する関数
 * @returns ゲームセクションコンポーネント
 */
export const GameSectionComponent: React.FC<GameSectionProps> = ({
  imageUrl,
  originalImageSize,
  pieces,
  division,
  elapsedTime,
  completed,
  hintModeEnabled,
  emptyPosition,
  handlePieceMove,
  handleResetGame,
  toggleHintMode,
  handleEmptyPanelClick,
  handleEndGame,
  emptyPanelClicks,
  setPieces,
  setCompleted,
}) => (
  <section className="flex flex-col items-center w-full">
    {imageUrl && originalImageSize && (
      <>
        <PuzzleBoard
          imageUrl={imageUrl}
          originalWidth={originalImageSize.width}
          originalHeight={originalImageSize.height}
          pieces={pieces}
          division={division}
          elapsedTime={elapsedTime}
          completed={completed}
          hintMode={hintModeEnabled}
          emptyPosition={emptyPosition}
          onPieceMove={handlePieceMove}
          onReset={handleResetGame}
          onToggleHint={toggleHintMode}
          onEmptyPanelClick={handleEmptyPanelClick}
          onEndGame={handleEndGame}
        />
        <>
          {completed && <div>パズルが完成しました！</div>}
          <button
            className="bg-green-500 text-white py-3 px-6 rounded mt-2"
            onClick={handleEndGame}
            style={{ marginTop: completed ? '10px' : '0' }}
          >
            {completed ? '設定に戻る' : 'ゲームを終了して設定に戻る'}
          </button>
          {!completed && emptyPanelClicks >= 10 && (
            <button
              className="bg-orange-500 text-white py-3 px-6 rounded mt-2"
              onClick={() => completePuzzle(pieces, setPieces, setCompleted)}
              style={{ marginTop: '10px' }}
            >
              テスト：パズルを完成させる
            </button>
          )}
        </>
      </>
    )}
  </section>
);
