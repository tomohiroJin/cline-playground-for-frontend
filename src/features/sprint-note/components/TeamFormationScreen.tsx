import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  NextButton,
} from './styles';
import TextReveal from './TextReveal';
import { TEAM_FORMATION_TEXT } from '../constants/texts';

type TeamFormationScreenProps = {
  onNext: () => void;
};

// チーム結成画面
const TeamFormationScreen: React.FC<TeamFormationScreenProps> = ({ onNext }) => {
  const [showButton, setShowButton] = useState(false);

  const handleComplete = useCallback(() => {
    setShowButton(true);
  }, []);

  const paragraphs = TEAM_FORMATION_TEXT.split('\n\n');

  return (
    <GameContainer>
      <PhaseHeader>── チーム結成 ──</PhaseHeader>
      <ContentArea>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
      </ContentArea>
      {showButton && <NextButton onClick={onNext}>次へ</NextButton>}
    </GameContainer>
  );
};

export default TeamFormationScreen;
