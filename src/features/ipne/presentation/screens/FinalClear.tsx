/**
 * 最終クリア画面コンポーネント（5ステージクリア後）
 * Clear.tsx をベースに5ステージ用に拡張
 */
import React, { useState } from 'react';
import {
  Overlay,
  RetryButton,
  BackToTitleButton,
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
  getRatingColor,
  getEndingImage,
  getEndingVideo,
} from '../../ending';
import { getEndingEpilogue } from '../../story';
import { formatTimeShort } from '../../timer';

/**
 * 最終クリア画面コンポーネント（5ステージ対応版）
 */
export const FinalClearScreen: React.FC<{
  onRetry: () => void;
  onBackToTitle: () => void;
  clearTime: number;
  rating: RatingValue;
  isNewBest: boolean;
}> = ({ onRetry, onBackToTitle, clearTime, rating, isNewBest }) => {
  const epilogue = getEndingEpilogue(rating);
  const ratingColor = getRatingColor(rating);
  const endingImage = getEndingImage(rating);
  const endingVideo = getEndingVideo(rating);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <Overlay>
      <ResultContainer>
        {isNewBest && <NewBestBadge>NEW BEST!</NewBestBadge>}
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
