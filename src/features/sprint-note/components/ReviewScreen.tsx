import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  NextButton,
} from './styles';
import TextReveal from './TextReveal';
import { GameState } from '../types';
import { getSprintPhaseHeader } from '../constants/texts';

type ReviewScreenProps = {
  state: GameState;
  onNext: () => void;
};

// レビュー画面
const ReviewScreen: React.FC<ReviewScreenProps> = ({ state, onNext }) => {
  const [showButton, setShowButton] = useState(false);

  const handleComplete = useCallback(() => {
    setShowButton(true);
  }, []);

  const currentRecord = state.sprints[state.sprints.length - 1];
  const { userReaction, stakeholderReaction, qualityComment } =
    currentRecord?.reviewResult || {
      userReaction: '',
      stakeholderReaction: '',
      qualityComment: '',
    };

  const header = getSprintPhaseHeader(state.currentSprint, 'レビュー');
  const paragraphs = [
    userReaction,
    stakeholderReaction,
    ...(qualityComment ? [qualityComment] : []),
  ].filter(Boolean);

  return (
    <GameContainer>
      <PhaseHeader>── {header} ──</PhaseHeader>
      <ContentArea>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
      </ContentArea>
      {showButton && <NextButton onClick={onNext}>次へ</NextButton>}
    </GameContainer>
  );
};

export default ReviewScreen;
