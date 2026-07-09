import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { SetupSection, StartButton } from '../pages/PuzzlePage.styles';
import { ArtFrame } from './molecules/ArtFrame';
import { galleryTokens } from '../pages/gallery-theme';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Hero = styled(ArtFrame)`
  width: 150px;
  margin: 0 auto 22px;
  animation: ${fadeIn} 0.8s ease-out;
`;

/** ヒーロー額の中身（作品を象徴する静かなグラデ面） */
const HeroArt = styled.div`
  height: 96px;
  background: linear-gradient(135deg, ${galleryTokens.sage}, ${galleryTokens.gold});
`;

const Title = styled.h1`
  font-family: Georgia, 'Times New Roman', 'Yu Mincho', serif;
  font-size: 2.4rem;
  letter-spacing: 0.14em;
  margin: 0 0 8px;
  color: ${galleryTokens.ink};
  animation: ${fadeIn} 0.8s ease-out;
`;

const Kicker = styled.p`
  font-size: 0.72rem;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: ${galleryTokens.sub};
  margin: 0 0 24px;
  animation: ${fadeIn} 0.8s ease-out 0.3s both;
`;

const EnterButton = styled(StartButton)`
  animation: ${fadeIn} 0.8s ease-out 0.6s both;
`;

/** 収蔵目録（コレクション画面）への導線ボタン */
const SecondaryButton = styled.button`
  display: block;
  margin: 14px auto 0;
  min-height: 44px;
  background: transparent;
  border: none;
  color: ${galleryTokens.sub};
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  cursor: pointer;
  text-decoration: underline;
  animation: ${fadeIn} 0.8s ease-out 0.9s both;

  &:hover {
    color: ${galleryTokens.goldText};
  }

  &:focus-visible {
    outline: 2px solid ${galleryTokens.ink};
    outline-offset: 2px;
  }
`;

type TitleScreenProps = {
  onStart: () => void;
  onDebugActivate: () => void;
  onOpenCollection: () => void;
  onStartDaily: () => void;
  onStartChallenge: () => void;
};

const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onDebugActivate,
  onOpenCollection,
  onStartDaily,
  onStartChallenge,
}) => {
  const bufferRef = useRef('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      bufferRef.current = (bufferRef.current + e.key).slice(-3);
      if (bufferRef.current === 'jin') {
        onDebugActivate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDebugActivate]);

  return (
    <SetupSection>
      <Hero>
        <HeroArt />
      </Hero>
      <Title>ピクチャーパズル</Title>
      <Kicker>Your Private Gallery</Kicker>
      <EnterButton onClick={onStart}>入館する</EnterButton>
      <SecondaryButton onClick={onStartDaily}>本日の一枚</SecondaryButton>
      <SecondaryButton onClick={onStartChallenge}>鑑定チャレンジ</SecondaryButton>
      <SecondaryButton onClick={onOpenCollection}>収蔵目録を見る</SecondaryButton>
    </SetupSection>
  );
};

export default TitleScreen;
