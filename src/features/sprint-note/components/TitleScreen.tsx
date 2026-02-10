import React from 'react';
import {
  GameContainer,
  GameTitle,
  GameSubtitle,
  NextButton,
} from './styles';

type TitleScreenProps = {
  onStart: () => void;
};

// タイトル画面
const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => (
  <GameContainer
    style={{
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    }}
  >
    <GameTitle>Sprint Note</GameTitle>
    <GameSubtitle>─ スプリントノート ─</GameSubtitle>
    <NextButton onClick={onStart}>はじめる</NextButton>
  </GameContainer>
);

export default TitleScreen;
