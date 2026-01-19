import React from 'react';
import {
  SetupSection,
  GameSection,
  ToggleButtonsContainer,
  ToggleButton,
  StartButton,
} from '../pages/HomePage.styles';
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
  <SetupSection>
    <ToggleButtonsContainer>
      <ToggleButton
        $isActive={imageSourceMode === 'upload'}
        onClick={() => setImageSourceMode('upload')}
      >
        画像をアップロード
      </ToggleButton>
      <ToggleButton
        $isActive={imageSourceMode === 'default'}
        onClick={() => setImageSourceMode('default')}
      >
        デフォルト画像から選択
      </ToggleButton>
    </ToggleButtonsContainer>
    {imageSourceMode === 'upload' ? (
      <ImageUploader onImageUpload={handleImageUpload} maxSizeInMB={10} />
    ) : (
      <DefaultImageSelector onImageSelect={handleImageUpload} />
    )}
    <DifficultySelector value={division} onChange={handleDifficultyChange} disabled={!imageUrl} />
    <StartButton onClick={handleStartGame} disabled={!imageUrl || !originalImageSize}>
      パズルを開始
    </StartButton>
  </SetupSection>
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
 * @param onSolve - パズルを完成させる関数（デバッグ用）
 */
export type GameSectionProps = {
  imageUrl: string | null;
  originalImageSize: { width: number; height: number } | null;
  pieces: ReadonlyArray<PuzzlePiece>;
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
  onSolve: () => void;
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
 * @param onSolve - パズルを完成させる関数
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
  onSolve,
}) => (
  <GameSection>
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
          <StartButton onClick={handleEndGame} style={{ marginTop: completed ? '10px' : '0' }}>
            {completed ? '設定に戻る' : 'ゲームを終了して設定に戻る'}
          </StartButton>
          {!completed && emptyPanelClicks >= 10 && (
            <StartButton
              onClick={onSolve}
              style={{ marginTop: '10px', backgroundColor: '#ff9800' }}
            >
              テスト：パズルを完成させる
            </StartButton>
          )}
        </>
      </>
    )}
  </GameSection>
);
