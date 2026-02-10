import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  NextButton,
  TaskItem,
  FlavorText,
} from './styles';
import TextReveal from './TextReveal';
import { GameState } from '../types';
import { getDevelopmentFlavorText } from '../utils/game-logic';
import { getSprintPhaseHeader } from '../constants/texts';

type DevelopmentScreenProps = {
  state: GameState;
  onNext: () => void;
};

// 開発画面
const DevelopmentScreen: React.FC<DevelopmentScreenProps> = ({
  state,
  onNext,
}) => {
  const [showButton, setShowButton] = useState(false);

  const handleComplete = useCallback(() => {
    setShowButton(true);
  }, []);

  const currentRecord = state.sprints[state.sprints.length - 1];
  const selectedTasks = currentRecord?.selectedTasks || [];
  const flavorText = getDevelopmentFlavorText(
    state.currentSprint,
    state.qualityScore
  );

  const header = getSprintPhaseHeader(state.currentSprint, '開発');
  const paragraphs = ['チームは計画に沿って開発を進めている……'];

  return (
    <GameContainer>
      <PhaseHeader>── {header} ──</PhaseHeader>
      <ContentArea>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        {selectedTasks.map(task => (
          <TaskItem key={task.id}>
            {task.name} ─ 進行中
          </TaskItem>
        ))}
        <FlavorText>{flavorText}</FlavorText>
      </ContentArea>
      {showButton && <NextButton onClick={onNext}>次へ</NextButton>}
    </GameContainer>
  );
};

export default DevelopmentScreen;
