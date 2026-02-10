import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  NextButton,
  QuoteText,
} from './styles';
import TextReveal from './TextReveal';
import { PROJECT_INTRO_TEXT } from '../constants/texts';

type ProjectIntroScreenProps = {
  onNext: () => void;
};

// プロジェクト提示画面
const ProjectIntroScreen: React.FC<ProjectIntroScreenProps> = ({ onNext }) => {
  const [showButton, setShowButton] = useState(false);

  const handleComplete = useCallback(() => {
    setShowButton(true);
  }, []);

  const paragraphs = PROJECT_INTRO_TEXT.split('\n\n');

  return (
    <GameContainer>
      <PhaseHeader>── プロジェクト提示 ──</PhaseHeader>
      <ContentArea>
        <QuoteText>
          <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        </QuoteText>
      </ContentArea>
      {showButton && <NextButton onClick={onNext}>次へ</NextButton>}
    </GameContainer>
  );
};

export default ProjectIntroScreen;
