import React, { useState, useEffect } from 'react';
import {
  PuzzlePageContainer,
  Instructions,
  InstructionsTitle,
  InstructionsList,
} from './PuzzlePage.styles';
import ClearHistoryList from '../components/molecules/ClearHistoryList';
import { getClearHistory, ClearHistory, migrateClearHistory } from '../utils/storage-utils';
import { PuzzleRecord } from '../types/puzzle';
import { SetupSectionComponent, GameSectionComponent } from '../components/PuzzleSections';
import { useGameFlow } from '../presentation/hooks/useGameFlow';
import { LocalPuzzleRecordStorage } from '../infrastructure/storage/puzzle-records-store';
import { LocalTotalClearsStorage } from '../infrastructure/storage/total-clears-store';
import TitleScreen from '../components/TitleScreen';
import CollectionView from '../components/molecules/CollectionView';
import { themes } from '../data/themes';
import { PuzzleRecordStorage, TotalClearsStorage } from '../application/ports/storage-port';
import { selectDailyPuzzle } from '../application/use-cases/select-daily-puzzle';
import { dateStringToSeed } from '../domain/puzzle/value-objects/seed';
import { getImageSize } from '../utils/puzzle-utils';
import { evaluateChallenge } from '../domain/puzzle/services/challenge-evaluator';

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
  // 収蔵目録（コレクション画面）の表示状態
  const [showCollection, setShowCollection] = useState(false);
  // 現在のモード（通常 / 本日の一枚 / 鑑定チャレンジ）
  const [mode, setMode] = useState<'normal' | 'daily' | 'challenge'>('normal');

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

  // 今日の日付を YYYYMMDD 文字列へ（presentation 層で副作用を閉じる）
  const todaySeedString = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  const handleStartDaily = async () => {
    const seed = dateStringToSeed(todaySeedString());
    const daily = selectDailyPuzzle(themes, seed);
    const url = `${window.location.origin}/images/default/${daily.filename}`;
    try {
      const { width, height } = await getImageSize(url);
      handleImageSelect(url, width, height);
      setMode('daily');
      setShowTitle(false);
      handleStartGame({ division: daily.division, seed });
    } catch (err) {
      console.error('本日の一枚の読み込みに失敗しました:', err);
    }
  };

  const handleStartChallenge = () => {
    setMode('challenge');
    setShowTitle(false);
  };

  // 初回マウント時にデータマイグレーション実行
  useEffect(() => {
    migrateClearHistory();
  }, []);

  // ゲームの状態が変わったときにクリア履歴を更新
  // 記録・累計クリア数の読み取りは書き込みと同じポート経由に統一する（単一の真実源）
  useEffect(() => {
    const history = getClearHistory();
    setClearHistory(history);
    setPuzzleRecords(recordStorage.getAll());
    setTotalClears(totalClearsStorage.get());
  }, [gameStarted, recordStorage, totalClearsStorage]);

  // 鑑定チャレンジモードかつスコア確定時のみメダルを算出（永続化せず都度評価）
  const challengeMedal =
    mode === 'challenge' && score
      ? evaluateChallenge({
          elapsedSeconds: score.elapsedTime,
          actualMoves: score.moveCount,
          optimalMoves: score.division * score.division * 2,
        })
      : undefined;

  return (
    <PuzzlePageContainer>
      {showCollection ? (
        <CollectionView
          themes={themes}
          records={puzzleRecords}
          totalClears={totalClears}
          onBack={() => setShowCollection(false)}
        />
      ) : showTitle ? (
        <TitleScreen
          onStart={() => {
            setMode('normal');
            setShowTitle(false);
          }}
          onDebugActivate={() => setDebugMode(true)}
          onOpenCollection={() => setShowCollection(true)}
          onStartDaily={handleStartDaily}
          onStartChallenge={handleStartChallenge}
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
          challengeMedal={challengeMedal}
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
      {!showTitle && !showCollection && (
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
