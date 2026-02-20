/**
 * 最終クリア画面コンポーネント（5ステージクリア後）
 * Clear.tsx をベースに5ステージ用に拡張 — 段階的フェードイン演出
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Overlay,
  RetryButton,
  BackToTitleButton,
  ResultContainer,
  ResultRating,
  ResultTime,
  ResultEpilogueTitle,
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

/** 演出タイムライン（ms） */
const TIMELINE = [
  0,      // 0: 背景暗転
  300,    // 1: NEW BEST バッジ
  800,    // 2: レーティング文字
  1600,   // 3: クリアタイム
  2400,   // 4: エピローグタイトル
  3200,   // 5: エピローグ段落 1
  3700,   // 6: エピローグ段落 2
  4200,   // 7: エピローグ段落 3
  4700,   // 8: エピローグ段落 4
  5500,   // 9: エンディング画像
  7000,   // 10: 操作ボタン
];

const FadeElement = styled.div<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.5s ease-in;
`;

const EpilogueParagraph = styled.p<{ $visible: boolean }>`
  font-size: 0.95rem;
  color: #cbd5e1;
  line-height: 1.8;
  margin: 0.4rem 0;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.5s ease-in;
`;

const BlurImage = styled(ResultImage)<{ $visible: boolean }>`
  filter: ${({ $visible }) => ($visible ? 'blur(0px)' : 'blur(10px)')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: filter 1s ease-in, opacity 1s ease-in;
`;

const SkipTimelineButton = styled.button`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #4a5568;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    color: #e2e8f0;
    border-color: #94a3b8;
  }
`;

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
  const [visibleElements, setVisibleElements] = useState(0);

  const paragraphs = epilogue.paragraphs;
  const totalElements = TIMELINE.length;

  useEffect(() => {
    const timers = TIMELINE.map((delay, i) =>
      setTimeout(() => setVisibleElements(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const skipTimeline = () => {
    setVisibleElements(totalElements);
  };

  const isVisible = (index: number) => visibleElements > index;

  return (
    <Overlay>
      <ResultContainer>
        <FadeElement $visible={isVisible(1)}>
          {isNewBest && <NewBestBadge>NEW BEST!</NewBestBadge>}
        </FadeElement>
        <FadeElement $visible={isVisible(2)}>
          <ResultRating $color={ratingColor}>{rating.toUpperCase()}</ResultRating>
        </FadeElement>
        <FadeElement $visible={isVisible(3)}>
          <ResultTime>{formatTimeShort(clearTime)}</ResultTime>
        </FadeElement>
        <FadeElement $visible={isVisible(4)}>
          <ResultEpilogueTitle>{epilogue.title}</ResultEpilogueTitle>
        </FadeElement>

        {paragraphs ? (
          paragraphs.map((p, i) => (
            <EpilogueParagraph key={i} $visible={isVisible(5 + i)}>
              {p}
            </EpilogueParagraph>
          ))
        ) : (
          <FadeElement $visible={isVisible(5)}>
            <p style={{ color: '#cbd5e1', lineHeight: 1.8 }}>{epilogue.text}</p>
          </FadeElement>
        )}

        <FadeElement $visible={isVisible(9)}>
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
                <BlurImage
                  $visible={isVisible(9)}
                  src={endingImage}
                  alt={`${rating}ランククリア`}
                />
                <VideoPlayButton onClick={() => setShowVideo(true)}>
                  特別動画を見る
                </VideoPlayButton>
              </>
            )
          ) : (
            <BlurImage
              $visible={isVisible(9)}
              src={endingImage}
              alt={`${rating}ランククリア`}
            />
          )}
        </FadeElement>

        <FadeElement $visible={isVisible(10)}>
          <RetryButton onClick={onRetry}>もう一度プレイ</RetryButton>
          <BackToTitleButton onClick={onBackToTitle}>タイトルに戻る</BackToTitleButton>
        </FadeElement>
      </ResultContainer>

      {visibleElements < totalElements && (
        <SkipTimelineButton onClick={skipTimeline}>
          スキップ
        </SkipTimelineButton>
      )}
    </Overlay>
  );
};
