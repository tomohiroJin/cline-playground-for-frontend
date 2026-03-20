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
import { useGameFlow } from '../presentation/hooks/useGameFlow';
import { LocalPuzzleRecordStorage } from '../infrastructure/storage/puzzle-records-store';
import { LocalTotalClearsStorage } from '../infrastructure/storage/total-clears-store';
import TitleScreen from '../components/TitleScreen';
import { PuzzleRecordStorage, TotalClearsStorage } from '../application/ports/storage-port';

/** デフォルトのストレージインスタンス（コンポーネント外で生成してリレンダリングを防ぐ） */
const defaultRecordStorage = new LocalPuzzleRecordStorage();
const defaultTotalClearsStorage = new LocalTotalClearsStorage();

interface PuzzlePageProps {
  /** パズル記録ストレージ（テスト時のモック差し替え用） */
  readonly recordStorage?: PuzzleRecordStorage;
  /** 累計クリア数ストレージ（テスト時のモック差し替え用） */
  readonly totalClearsStorage?: TotalClearsStorage;
}

/**
 * パズルゲームページコンポーネント
 */
const PuzzlePage: React.FC<PuzzlePageProps> = ({
  recordStorage = defaultRecordStorage,
  totalClearsStorage = defaultTotalClearsStorage,
}) => {
  // タイトル画面の状態
  const [showTitle, setShowTitle] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // クリア履歴の状態
  const [clearHistory, setClearHistory] = useState<ClearHistory[]>([]);
  const [puzzleRecords, setPuzzleRecords] = useState<PuzzleRecord[]>([]);
  const [totalClears, setTotalClears] = useState(0);

  // 新しいゲームフロー制御フック
  const {
    gamePhase,
    imageUrl,
    imageSize,
    division,
    boardState,
    elapsedTime,
    score,
    isBestScore,
    hintModeEnabled,
    correctRate,
    emptyPanelClicks,
    toggleHintMode,
    handleImageSelect,
    handleDifficultyChange,
    handleStartGame,
    handlePieceMove,
    handleResetGame,
    handleEndGame,
    handleEmptyPanelClick,
    completeForDebug,
  } = useGameFlow({ recordStorage, totalClearsStorage });

  const gameStarted = gamePhase === 'playing';

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
  }, [gameStarted]);

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
          imageUrl={imageUrl}
          originalImageSize={imageSize}
          division={division}
          records={puzzleRecords}
          totalClears={totalClears}
        />
      ) : (
        <GameSectionComponent
          imageUrl={imageUrl}
          originalImageSize={imageSize}
          pieces={boardState ? [...boardState.pieces] : []}
          division={boardState?.division ?? division}
          elapsedTime={elapsedTime}
          completed={boardState?.isCompleted ?? false}
          hintModeEnabled={hintModeEnabled}
          emptyPosition={boardState?.emptyPosition ?? { row: 0, col: 0 }}
          moveCount={boardState?.moveCount ?? 0}
          correctRate={correctRate}
          score={score}
          isBestScore={isBestScore}
          handlePieceMove={handlePieceMove}
          handleResetGame={handleResetGame}
          toggleHintMode={toggleHintMode}
          handleEmptyPanelClick={handleEmptyPanelClick}
          handleEndGame={handleEndGame}
          emptyPanelClicks={emptyPanelClicks}
          onCompletePuzzleForDebug={completeForDebug}
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
