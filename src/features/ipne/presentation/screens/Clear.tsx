/**
 * クリア画面・ゲームオーバー画面コンポーネント
 */
import React, { useState } from 'react';
import {
  Overlay,
  RetryButton,
  BackToTitleButton,
  GameOverTitle,
  GameOverButton,
  ResultContainer,
  ResultRating,
  ResultTime,
  ResultEpilogueTitle,
  ResultEpilogueText,
  ResultImage,
  ResultVideo,
  NewBestBadge,
  VideoPlayButton,
} from '../../../../pages/IpnePage.styles';
import { RatingValue } from '../../types';
import {
  getEpilogueText,
  getGameOverText,
  getRatingColor,
  getEndingImage,
  getGameOverImage,
  getEndingVideo,
} from '../../ending';
import { formatTimeShort } from '../../timer';

/**
 * クリア画面コンポーネント（MVP4拡張）
 */
export const ClearScreen: React.FC<{
  onRetry: () => void;
  onBackToTitle: () => void;
  clearTime: number;
  rating: RatingValue;
  isNewBest: boolean;
}> = ({ onRetry, onBackToTitle, clearTime, rating, isNewBest }) => {
  const epilogue = getEpilogueText(rating);
  const ratingColor = getRatingColor(rating);
  const endingImage = getEndingImage(rating);
  const endingVideo = getEndingVideo(rating);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <Overlay>
      <ResultContainer>
        {isNewBest && <NewBestBadge>🏆 NEW BEST!</NewBestBadge>}
        <ResultRating $color={ratingColor}>{rating.toUpperCase()}</ResultRating>
        <ResultTime>{formatTimeShort(clearTime)}</ResultTime>
        <ResultEpilogueTitle>{epilogue.title}</ResultEpilogueTitle>
        <ResultEpilogueText>{epilogue.text}</ResultEpilogueText>
        {endingVideo ? (
          showVideo ? (
            <ResultVideo
              src={endingVideo}
              autoPlay
              muted
              playsInline
              onEnded={() => setShowVideo(false)}
              aria-label={`${rating}ランククリア動画`}
            />
          ) : (
            <>
              <ResultImage src={endingImage} alt={`${rating}ランククリア`} />
              <VideoPlayButton onClick={() => setShowVideo(true)}>
                特別動画を見る
              </VideoPlayButton>
            </>
          )
        ) : (
          <ResultImage src={endingImage} alt={`${rating}ランククリア`} />
        )}
        <RetryButton onClick={onRetry}>もう一度プレイ</RetryButton>
        <BackToTitleButton onClick={onBackToTitle}>タイトルに戻る</BackToTitleButton>
      </ResultContainer>
    </Overlay>
  );
};

/**
 * ゲームオーバー画面コンポーネント（MVP4拡張）
 */
export const GameOverScreen: React.FC<{
  onRetry: () => void;
  onBackToTitle: () => void;
}> = ({ onRetry, onBackToTitle }) => {
  const gameOverText = getGameOverText();
  const gameOverImage = getGameOverImage();

  return (
    <Overlay>
      <ResultContainer>
        <GameOverTitle>GAME OVER</GameOverTitle>
        <ResultEpilogueTitle>{gameOverText.title}</ResultEpilogueTitle>
        <ResultEpilogueText>{gameOverText.text}</ResultEpilogueText>
        <ResultImage src={gameOverImage} alt="ゲームオーバー" />
        <GameOverButton onClick={onRetry}>リトライ</GameOverButton>
        <GameOverButton onClick={onBackToTitle}>タイトルへ</GameOverButton>
      </ResultContainer>
    </Overlay>
  );
};
