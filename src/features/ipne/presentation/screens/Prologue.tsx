/**
 * プロローグ画面コンポーネント
 */
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  Overlay,
  StoryText,
  SkipButton,
} from '../../../../pages/IpnePage.styles';
import { getPrologueStory } from '../../story';
import { getStoryImage } from '../../storyImages';
import prologueBg from '../../../../assets/images/ipne_prologue_bg.webp';
import prologueBgMobile from '../../../../assets/images/ipne_prologue_bg_mobile.webp';

const PROLOGUE_AUTO_ADVANCE_MS = 2000;
const PROLOGUE_SLIDE_ADVANCE_MS = 3000;

const SlideTitle = styled.h2`
  font-size: 1.5rem;
  color: #fbbf24;
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: fadeIn 0.5s ease-in forwards;

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
`;

const SlideImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: fadeIn 0.5s ease-in forwards;
`;

const SlideIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const SlideIndicatorDot = styled.div<{ $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? '#fbbf24' : '#4a5568')};
  transition: background 0.3s ease;
`;

const NextButton = styled.button`
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background: #2563eb;
  }
`;

const BottomControls = styled.div`
  position: absolute;
  bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

/**
 * プロローグ画面コンポーネント
 */
export const PrologueScreen: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const story = getPrologueStory();
  const slides = story.slides;

  // マルチシーンモード
  if (slides && slides.length > 0) {
    return <MultiSlideProlog slides={slides} onSkip={onSkip} />;
  }

  // フォールバック: 既存動作
  return <LegacyPrologue lines={story.lines} onSkip={onSkip} />;
};

/** マルチシーン表示 */
const MultiSlideProlog: React.FC<{
  slides: NonNullable<ReturnType<typeof getPrologueStory>['slides']>;
  onSkip: () => void;
}> = ({ slides, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [allLinesShown, setAllLinesShown] = useState(false);

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const advanceSlide = useCallback(() => {
    if (isLastSlide) {
      onSkip();
    } else {
      setCurrentSlide(prev => prev + 1);
      setTextIndex(0);
      setAllLinesShown(false);
    }
  }, [isLastSlide, onSkip]);

  // テキスト逐次表示
  useEffect(() => {
    if (textIndex < slide.lines.length - 1) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, PROLOGUE_AUTO_ADVANCE_MS);
      return () => clearTimeout(timer);
    } else {
      setAllLinesShown(true);
    }
  }, [textIndex, slide.lines.length]);

  // 全行表示後、自動次スライド
  useEffect(() => {
    if (allLinesShown) {
      const timer = setTimeout(advanceSlide, PROLOGUE_SLIDE_ADVANCE_MS);
      return () => clearTimeout(timer);
    }
  }, [allLinesShown, advanceSlide]);

  const imageEntry = slide.imageKey ? getStoryImage(slide.imageKey) : undefined;

  return (
    <Overlay $bgImage={prologueBg} $bgImageMobile={prologueBgMobile}>
      <div
        style={{
          width: '100%',
          maxWidth: '48rem',
          textAlign: 'center',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {imageEntry && (
          <SlideImage
            key={`img-${currentSlide}`}
            src={imageEntry.src}
            alt={imageEntry.alt}
            width={imageEntry.width}
            height={imageEntry.height}
          />
        )}
        {slide.title && <SlideTitle key={`title-${currentSlide}`}>{slide.title}</SlideTitle>}
        {slide.lines.slice(0, textIndex + 1).map((text, i) => (
          <StoryText key={`${currentSlide}-${i}`} $active={i === textIndex}>
            {text}
          </StoryText>
        ))}
        {allLinesShown && !isLastSlide && (
          <NextButton onClick={advanceSlide}>次へ</NextButton>
        )}
      </div>
      <BottomControls>
        <SlideIndicator>
          {slides.map((_, i) => (
            <SlideIndicatorDot key={i} $active={i === currentSlide} />
          ))}
        </SlideIndicator>
        <SkipButton onClick={onSkip} aria-label="スキップ">
          スキップ
        </SkipButton>
      </BottomControls>
    </Overlay>
  );
};

/** レガシー表示（slides なしの場合） */
const LegacyPrologue: React.FC<{
  lines: string[];
  onSkip: () => void;
}> = ({ lines, onSkip }) => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    if (textIndex < lines.length - 1) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, PROLOGUE_AUTO_ADVANCE_MS);
      return () => clearTimeout(timer);
    } else {
      const autoSkipTimer = setTimeout(() => {
        onSkip();
      }, 3000);
      return () => clearTimeout(autoSkipTimer);
    }
  }, [textIndex, lines.length, onSkip]);

  return (
    <Overlay $bgImage={prologueBg} $bgImageMobile={prologueBgMobile}>
      <div
        style={{
          width: '100%',
          maxWidth: '48rem',
          textAlign: 'center',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {lines.slice(0, textIndex + 1).map((text, i) => (
          <StoryText key={i} $active={i === textIndex}>
            {text}
          </StoryText>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '2.5rem' }}>
        <SkipButton onClick={onSkip} aria-label="スキップ">
          スキップ
        </SkipButton>
      </div>
    </Overlay>
  );
};
