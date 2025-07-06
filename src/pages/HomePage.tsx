import React, { useState, useEffect } from 'react';
import ClearHistoryList from '../components/molecules/ClearHistoryList';
import { getClearHistory, ClearHistory } from '../utils/storage-utils';
import {
  SetupSectionComponent,
  GameSectionComponent,
} from '../components/HomePageSections';
import { useGameState } from '../hooks/useGameState';

/**
 * ホームページコンポーネント
 */
const HomePage: React.FC = () => {
  // クリア履歴の状態
  const [clearHistory, setClearHistory] = useState<ClearHistory[]>([]);

  // 状態管理をフックに移動
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
  } = useGameState();

  // ゲームの状態が変わったときにクリア履歴を更新
  useEffect(() => {
    const history = getClearHistory();
    setClearHistory(history);
  }, [gameStarted]); // gameStartedが変わったとき（ゲーム終了時など）に履歴を更新
  return (
    <div className="flex flex-col items-center">
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
      <div className="my-5 p-4 bg-gray-100 border-l-4 border-green-500 rounded w-full max-w-[600px]">
        <h3 className="mt-0 text-gray-800">遊び方</h3>
        <ul className="mt-2 pl-5 text-gray-700 list-disc">
          <li>画像をアップロードするか、デフォルト画像から選択して、難易度を選択します。</li>
          <li>「パズルを開始」ボタンをクリックすると、パズルが始まります。</li>
          <li>空白の隣にあるピースをクリックすると、そのピースが空白の位置に移動します。</li>
          <li>すべてのピースを正しい位置に戻すと、パズルが完成します。</li>
          <li>「ヒントを表示」ボタンをクリックすると、元の画像が薄く表示されます。</li>
        </ul>
      </div>

      {/* クリア履歴の表示 */}
      {!gameStarted && <ClearHistoryList history={clearHistory} />}
    </div>
  );
};

export default HomePage;
