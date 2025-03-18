import React, { useState } from "react";
import styled from "styled-components";
import ImageUploader from "../components/molecules/ImageUploader";
import DifficultySelector from "../components/molecules/DifficultySelector";
import PuzzleBoard from "../components/organisms/PuzzleBoard";
import { usePuzzle } from "../hooks/usePuzzle";
import { useHintMode } from "../hooks/useHintMode";

// スタイル付きコンポーネント
const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SetupSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
`;

const StartButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const GameSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Instructions = styled.div`
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f8f8;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
  width: 100%;
  max-width: 600px;
`;

const InstructionsTitle = styled.h3`
  margin-top: 0;
  color: #333;
`;

const InstructionsList = styled.ul`
  margin: 10px 0 0;
  padding-left: 20px;
  color: #555;
`;

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
    movePiece(pieceId, row, col);
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
          <ImageUploader onImageUpload={handleImageUpload} maxSizeInMB={10} />
          <DifficultySelector
            value={division}
            onChange={handleDifficultyChange}
            disabled={!imageUrl}
          />
          <StartButton
            onClick={handleStartGame}
            disabled={!imageUrl || !originalImageSize}
          >
            パズルを開始
          </StartButton>
        </SetupSection>
      ) : (
        <GameSection>
          {imageUrl && originalImageSize && (
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
          )}
          {!completed && (
            <StartButton onClick={handleEndGame}>
              ゲームを終了して設定に戻る
            </StartButton>
          )}
        </GameSection>
      )}

      <Instructions>
        <InstructionsTitle>遊び方</InstructionsTitle>
        <InstructionsList>
          <li>画像をアップロードして、難易度を選択します。</li>
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
