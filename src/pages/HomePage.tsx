import React from 'react';
import {
  HomeContainer,
  Instructions,
  InstructionsTitle,
  InstructionsList,
} from './HomePage.styles';
import { SetupSectionComponent, GameSectionComponent } from '../components/HomePageSections';
import { useGameState } from '../hooks/useGameState';

/**
 * ホームページコンポーネント
 */
const HomePage: React.FC = () => {
  const {
    toggleHintMode,
    gameStarted,
    imageSourceMode,
    setImageSourceMode,
    handleImageUpload,
    handleDifficultyChange,
    handleStartGame,
    handlePieceMove,
    handleResetGame,
    handleEndGame,
    handleEmptyPanelClick,
    gameState,
  } = useGameState(); // 状態管理をフックに移動
  return (
    <HomeContainer>
      {!gameStarted ? (
        <SetupSectionComponent
          imageSourceMode={imageSourceMode}
          setImageSourceMode={setImageSourceMode}
          handleImageUpload={handleImageUpload}
          handleDifficultyChange={handleDifficultyChange}
          handleStartGame={handleStartGame}
          imageUrl={gameState.imageUrl}
          originalImageSize={gameState.originalImageSize}
          division={gameState.division}
        />
      ) : (
        <GameSectionComponent
          {...gameState}
          emptyPosition={gameState.emptyPosition || { row: 0, col: 0 }} // Provide default position if null
          toggleHintMode={toggleHintMode}
          handlePieceMove={handlePieceMove}
          handleResetGame={handleResetGame}
          handleEndGame={handleEndGame}
          handleEmptyPanelClick={handleEmptyPanelClick}
        />
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
