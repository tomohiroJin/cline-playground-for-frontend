import React, { useState, useEffect } from 'react';
import {
  PuzzlePageContainer,
  Instructions,
  InstructionsTitle,
  InstructionsList,
} from './PuzzlePage.styles';
import ClearHistoryList from '../components/molecules/ClearHistoryList';
import { getClearHistory, ClearHistory, migrateClearHistory, getPuzzleRecords, getTotalClears } from '../utils/storage-utils';
import { PuzzleRecord } from '../types/puzzle';
import { SetupSectionComponent, GameSectionComponent } from '../components/PuzzleSections';
import { useGameState } from '../hooks/useGameState';
import TitleScreen from '../components/TitleScreen';

/**
 * パズルゲームページコンポーネント
 */
const PuzzlePage: React.FC = () => {
  // タイトル画面の状態
  const [showTitle, setShowTitle] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // クリア履歴の状態
  const [clearHistory, setClearHistory] = useState<ClearHistory[]>([]);
  const [puzzleRecords, setPuzzleRecords] = useState<PuzzleRecord[]>([]);
  const [totalClears, setTotalClears] = useState(0);

  // 状態管理をフックに移動
  const {
    toggleHintMode,
    gameStarted,
    handleImageSelect,
    handleDifficultyChange,
    handleStartGame,
    handlePieceMove,
    handleResetGame,
    handleEndGame,
    handleEmptyPanelClick,
    gameState,
  } = useGameState();

  // 初回マウント時にデータマイグレーション実行
  useEffect(() => {
    migrateClearHistory();
  }, []);

  // ゲームの状態が変わったときにクリア履歴を更新
  useEffect(() => {
    const history = getClearHistory();
    setClearHistory(history);
    setPuzzleRecords(getPuzzleRecords());
    setTotalClears(getTotalClears());
  }, [gameStarted]); // gameStartedが変わったとき（ゲーム終了時など）に履歴を更新
  return (
    <PuzzlePageContainer>
      {showTitle ? (
        <TitleScreen
          onStart={() => setShowTitle(false)}
          onDebugActivate={() => setDebugMode(true)}
        />
      ) : !gameStarted ? (
        <SetupSectionComponent
          handleImageSelect={handleImageSelect}
          handleDifficultyChange={handleDifficultyChange}
          handleStartGame={handleStartGame}
          imageUrl={gameState.imageUrl}
          originalImageSize={gameState.originalImageSize}
          division={gameState.division}
          records={puzzleRecords}
          totalClears={totalClears}
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
          debugMode={debugMode}
        />
      )}
      {!showTitle && (
        <>
          <Instructions>
            <InstructionsTitle>遊び方</InstructionsTitle>
            <InstructionsList>
              <li>デフォルト画像から選択して、難易度を選択します。</li>
              <li>「パズルを開始」ボタンをクリックすると、パズルが始まります。</li>
              <li>空白の隣にあるピースをクリックすると、そのピースが空白の位置に移動します。</li>
              <li>すべてのピースを正しい位置に戻すと、パズルが完成します。</li>
              <li>「ヒントを表示」ボタンをクリックすると、元の画像が薄く表示されます。</li>
            </InstructionsList>
          </Instructions>

          {/* クリア履歴・ベストスコアの表示 */}
          {!gameStarted && <ClearHistoryList history={clearHistory} records={puzzleRecords} />}
        </>
      )}
    </PuzzlePageContainer>
  );
};

export default PuzzlePage;
