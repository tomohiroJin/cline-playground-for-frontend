import React from 'react';
import {
  SetupSection,
  GameSection,
  StartButton,
} from '../pages/PuzzlePage.styles';
import ThemeSelector from '../components/molecules/ThemeSelector';
import DifficultySelector from '../components/molecules/DifficultySelector';
import { themes } from '../data/themes';
import { PuzzleRecord } from '../types/puzzle';
import PuzzleBoard from '../components/organisms/PuzzleBoard';
import { PuzzlePiece } from '../store/atoms';
import { ShareButton } from './molecules/ShareButton';
import { PuzzleScore } from '../types/puzzle';

/**
 * SetupSectionコンポーネントのプロパティの型定義
 *
 * @param handleImageSelect - 画像を選択する関数
 * @param handleDifficultyChange - 難易度を変更する関数
 * @param handleStartGame - ゲームを開始する関数
 * @param imageUrl - 選択された画像のURL
 * @param originalImageSize - 元の画像のサイズ
 * @param division - パズルの分割数
 */
export type SetupSectionProps = {
  handleImageSelect: (url: string, width: number, height: number) => void;
  handleDifficultyChange: (newDivision: number) => void;
  handleStartGame: () => void;
  imageUrl: string | null;
  originalImageSize: { width: number; height: number } | null;
  division: number;
  records: PuzzleRecord[];
  totalClears: number;
};

/**
 * SetupSectionコンポーネント
 */
export const SetupSectionComponent: React.FC<SetupSectionProps> = ({
  handleImageSelect,
  handleDifficultyChange,
  handleStartGame,
  imageUrl,
  originalImageSize,
  division,
  records,
  totalClears,
}) => (
  <SetupSection>
    <ThemeSelector
      themes={themes}
      records={records}
      totalClears={totalClears}
      onImageSelect={handleImageSelect}
    />
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
  moveCount: number;
  correctRate: number;
  score: PuzzleScore | null;
  isBestScore: boolean;
  handlePieceMove: (pieceId: number, row: number, col: number) => void;
  handleResetGame: () => void;
  toggleHintMode: () => void;
  handleEmptyPanelClick: () => void;
  handleEndGame: () => void;
  emptyPanelClicks: number;
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  debugMode?: boolean;
};

/**
 * GameSection コンポーネント
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
  moveCount,
  correctRate,
  score,
  isBestScore,
  handlePieceMove,
  handleResetGame,
  toggleHintMode,
  handleEmptyPanelClick,
  handleEndGame,
  emptyPanelClicks,
  setPieces,
  setCompleted,
  debugMode,
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
          moveCount={moveCount}
          correctRate={correctRate}
          score={score}
          isBestScore={isBestScore}
          onPieceMove={handlePieceMove}
          onReset={handleResetGame}
          onToggleHint={toggleHintMode}
          onEmptyPanelClick={handleEmptyPanelClick}
          onEndGame={handleEndGame}
        />
        <>
          {completed && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                margin: '10px 0',
              }}
            >
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>パズルが完成しました！</div>
              <ShareButton
                text={
                  score
                    ? `パズル（${division}x${division}）をクリア！ スコア: ${score.totalScore.toLocaleString()} ランク: ${score.rank} タイム: ${score.elapsedTime}秒`
                    : `パズル（${division}x${division}）をクリアしました！ タイム: ${elapsedTime}秒`
                }
                hashtags={['PuzzleGame', 'GamePlatform']}
              />
            </div>
          )}
          <StartButton onClick={handleEndGame} style={{ marginTop: completed ? '10px' : '0' }}>
            {completed ? '設定に戻る' : 'ゲームを終了して設定に戻る'}
          </StartButton>
          {!completed && (debugMode || emptyPanelClicks >= 10) && (
            <StartButton
              onClick={() => completePuzzle(pieces, setPieces, setCompleted)}
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
