import React from 'react';
import {
  GameSection,
  StartButton,
} from '../pages/PuzzlePage.styles';
import { PuzzlePiece, PuzzleScore } from '../types/puzzle';
import PuzzleBoard from '../components/organisms/PuzzleBoard';
import { ShareButton } from './molecules/ShareButton';

/**
 * GameSectionコンポーネントのプロパティの型定義
 */
export type Position = {
  row: number;
  col: number;
};

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
  onCompletePuzzleForDebug: () => void;
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
  onCompletePuzzleForDebug,
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
              onClick={onCompletePuzzleForDebug}
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
