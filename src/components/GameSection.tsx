import React from 'react';
import styled from 'styled-components';
import {
  GameSection,
  StartButton,
} from '../pages/PuzzlePage.styles';
import { galleryTokens } from '../pages/gallery-theme';
import { PuzzlePiece, PuzzleScore } from '../types/puzzle';
import PuzzleBoard from '../components/organisms/PuzzleBoard';
import { ArtFrame } from './molecules/ArtFrame';
import { ShareButton } from './molecules/ShareButton';
import { formatElapsedTime } from '../shared/utils/format';

/**
 * HUD 解説プレート（美術館の作品解説プレート風の情報表示）
 * オールキャップスの小さいラベル＋数値の組み合わせでまとめる
 */
const HudPlate = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
`;

const HudPlateItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const HudPlateLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${galleryTokens.sub};
`;

const HudPlateValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${galleryTokens.ink};
`;

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
        <HudPlate>
          <HudPlateItem>
            <HudPlateLabel>時間</HudPlateLabel>
            <HudPlateValue>{formatElapsedTime(elapsedTime)}</HudPlateValue>
          </HudPlateItem>
          <HudPlateItem>
            <HudPlateLabel>手数</HudPlateLabel>
            <HudPlateValue>{moveCount}</HudPlateValue>
          </HudPlateItem>
        </HudPlate>
        <ArtFrame>
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
        </ArtFrame>
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
