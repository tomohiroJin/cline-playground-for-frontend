import React, { useState, useEffect } from 'react';
import {
  HomeContainer,
  SetupSection,
  StartButton,
  GameSection,
  Instructions,
  InstructionsTitle,
  InstructionsList,
  ToggleButtonsContainer,
  ToggleButton,
} from './HomePage.styles';
import ImageUploader from '../components/molecules/ImageUploader';
import DefaultImageSelector from '../components/molecules/DefaultImageSelector';
import DifficultySelector from '../components/molecules/DifficultySelector';
import PuzzleBoard from '../components/organisms/PuzzleBoard';
import { usePuzzle } from '../hooks/usePuzzle';
import { useHintMode } from '../hooks/useHintMode';

/**
 * ホームページコンポーネント
 */
const HomePage: React.FC = () => {
  // パズルの状態と操作
  const {
    imageUrl,
    setImageUrl,
    originalImageSize,
    setOriginalImageSize,
    division,
    setDivision,
    pieces,
    emptyPosition,
    elapsedTime,
    completed,
    initializePuzzle,
    movePiece,
    resetPuzzle,
  } = usePuzzle();

  // ヒントモードの状態と操作
  const { hintModeEnabled, toggleHintMode } = useHintMode();

  // ゲームが開始されているかどうか
  const [gameStarted, setGameStarted] = useState(false);

  // 画像ソースモード（'upload'または'default'）
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'default'>('upload');

  // 画像がアップロードされたときの処理
  const handleImageUpload = (url: string, width: number, height: number) => {
    setImageUrl(url);
    setOriginalImageSize({ width, height });
  };

  // 難易度が変更されたときの処理
  const handleDifficultyChange = (newDivision: number) => {
    setDivision(newDivision);
  };

  // ゲームを開始する
  const handleStartGame = () => {
    initializePuzzle();
    setGameStarted(true);
  };

  // ピースが移動されたときの処理
  const handlePieceMove = (pieceId: number, row: number, col: number) => {
    movePiece(pieceId);
  };

  // ゲームをリセットする
  const handleResetGame = () => {
    resetPuzzle();
  };

  // ゲームを終了する
  const handleEndGame = () => {
    setGameStarted(false);
  };

  return (
    <HomeContainer>
      {!gameStarted ? (
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

          <DifficultySelector
            value={division}
            onChange={handleDifficultyChange}
            disabled={!imageUrl}
          />
          <StartButton onClick={handleStartGame} disabled={!imageUrl || !originalImageSize}>
            パズルを開始
          </StartButton>
        </SetupSection>
      ) : (
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
              />
              {completed ? (
                <div>パズルが完成しました！</div>
              ) : (
                <StartButton onClick={handleEndGame}>ゲームを終了して設定に戻る</StartButton>
              )}
            </>
          )}
        </GameSection>
      )}
      <Instructions>
        <InstructionsTitle>遊び方</InstructionsTitle>
        <InstructionsList>
          <li>画像をアップロードするか、デフォルト画像から選択して、難易度を選択します。</li>
          <li>「パズルを開始」ボタンをクリックすると、パズルが始まります。</li>
          <li>空白の隣にあるピースをクリックすると、そのピースが空白の位置に移動します。</li>
          <li>すべてのピースを正しい位置に戻すと、パズルが完成します。</li>
          <li>「ヒントを表示」ボタンをクリックすると、元の画像が薄く表示されます。</li>
        </InstructionsList>
      </Instructions>
    </HomeContainer>
  );
};

export default HomePage;
