/**
 * ステージ間ストーリー表示画面コンポーネント
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Overlay,
  SkipButton,
} from '../../../../pages/IpnePage.styles';
import { StoryScene } from '../../types';
import { getStoryImage } from '../../storyImages';

const StoryContainer = styled.div`
  width: 100%;
  max-width: 48rem;
  text-align: center;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StoryImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: storyImageFadeIn 0.8s ease-in forwards;

  @keyframes storyImageFadeIn {
    to {
      opacity: 1;
    }
  }
`;

const StoryTitle = styled.h2`
  font-size: 1.5rem;
  color: #fbbf24;
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeIn 0.5s ease-in forwards;

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
`;

const StoryLine = styled.p<{ $delay: number; $active: boolean }>`
  font-size: 1rem;
  color: #e2e8f0;
  line-height: 1.8;
  margin: 0.3rem 0;
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.5s ease-in;
`;

const NextButtonContainer = styled.div`
  position: absolute;
  bottom: 2.5rem;
`;

const NextButton = styled.button`
  padding: 0.8rem 2rem;
  font-size: 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #2563eb;
  }
`;

/**
 * ストーリー表示画面
 */
export const StageStoryScreen: React.FC<{
  story: StoryScene;
  onNext: () => void;
}> = ({ story, onNext }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const [allShown, setAllShown] = useState(false);

  const imageEntry = story.imageKey ? getStoryImage(story.imageKey) : undefined;

  useEffect(() => {
    if (visibleLines < story.lines.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAllShown(true);
    }
  }, [visibleLines, story.lines.length]);

  return (
    <Overlay>
      <StoryContainer>
        {imageEntry && (
          <StoryImage
            src={imageEntry.src}
            alt={imageEntry.alt}
            width={imageEntry.width}
            height={imageEntry.height}
          />
        )}
        <StoryTitle>{story.title}</StoryTitle>
        {story.lines.map((line, i) => (
          <StoryLine key={i} $delay={i * 0.5} $active={i < visibleLines}>
            {line}
          </StoryLine>
        ))}
      </StoryContainer>
      <NextButtonContainer>
        {allShown ? (
          <NextButton onClick={onNext}>次へ</NextButton>
        ) : (
          <SkipButton onClick={() => { setVisibleLines(story.lines.length); setAllShown(true); }}>
            スキップ
          </SkipButton>
        )}
      </NextButtonContainer>
    </Overlay>
  );
};
