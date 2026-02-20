import React from 'react';
import { PuzzleScore } from '../../types/puzzle';
import { formatElapsedTime } from '../../utils/puzzle-utils';
import { ShareButton } from './ShareButton';
import {
  ResultOverlay,
  ResultTitle,
  ResultList,
  ResultLabel,
  ResultValue,
  BestScoreBadge,
  ResultButtons,
  ResultButton,
} from './ResultScreen.styles';

export interface ResultScreenProps {
  imageAlt: string;
  division: number;
  score: PuzzleScore;
  isBestScore: boolean;
  onRetry: () => void;
  onBackToSetup: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({
  imageAlt,
  division,
  score,
  isBestScore,
  onRetry,
  onBackToSetup,
}) => {
  const shareText = `パズル「${imageAlt}」(${division}x${division}) をクリア！ スコア: ${score.totalScore.toLocaleString()} ランク: ${score.rank}`;

  return (
    <ResultOverlay data-testid="result-screen">
      <ResultTitle>パズル完成！</ResultTitle>
      <ResultList>
        <ResultLabel>📷</ResultLabel>
        <ResultValue>{imageAlt}</ResultValue>
        <ResultLabel>🧩</ResultLabel>
        <ResultValue>{division}×{division}</ResultValue>
        <ResultLabel>⏱</ResultLabel>
        <ResultValue>{formatElapsedTime(score.elapsedTime)}</ResultValue>
        <ResultLabel>👣</ResultLabel>
        <ResultValue>{score.moveCount}手 / 最適 {score.shuffleMoves}</ResultValue>
        <ResultLabel>📊</ResultLabel>
        <ResultValue>{score.totalScore.toLocaleString()}</ResultValue>
        <ResultLabel>⭐</ResultLabel>
        <ResultValue>{score.rank}</ResultValue>
      </ResultList>
      {isBestScore && <BestScoreBadge>ベストスコア更新！</BestScoreBadge>}
      <ResultButtons>
        <ShareButton
          text={shareText}
          hashtags={['PuzzleGame', 'GamePlatform']}
        />
        <ResultButton onClick={onRetry}>もう一度</ResultButton>
        <ResultButton $variant="secondary" onClick={onBackToSetup}>設定に戻る</ResultButton>
      </ResultButtons>
    </ResultOverlay>
  );
};

export default ResultScreen;
