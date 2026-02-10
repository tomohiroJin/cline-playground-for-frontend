import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  ChoiceArea,
  GoalCard,
  GoalName,
  GoalDescription,
} from './styles';
import TextReveal from './TextReveal';
import { Goal } from '../types';
import { GOALS } from '../constants/goals';

type GoalSelectionScreenProps = {
  onSelectGoal: (goal: Goal) => void;
};

// ゴール選択画面
const GoalSelectionScreen: React.FC<GoalSelectionScreenProps> = ({
  onSelectGoal,
}) => {
  const [showChoices, setShowChoices] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const handleComplete = useCallback(() => {
    setShowChoices(true);
  }, []);

  const handleSelect = useCallback(
    (goal: Goal) => {
      if (selectedId) return;
      setSelectedId(goal.id);
      setTimeout(() => onSelectGoal(goal), 500);
    },
    [selectedId, onSelectGoal]
  );

  const paragraphs = ['このプロジェクトで、チームは何を目指す？'];

  return (
    <GameContainer>
      <PhaseHeader>── ゴール選択 ──</PhaseHeader>
      <ContentArea>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        {showChoices && (
          <ChoiceArea>
            {GOALS.map(goal => (
              <GoalCard
                key={goal.id}
                $selected={selectedId === goal.id}
                $disabled={!!selectedId && selectedId !== goal.id}
                onClick={() => handleSelect(goal)}
                disabled={!!selectedId}
              >
                <GoalName>{goal.name}</GoalName>
                <GoalDescription>
                  {goal.description}
                  {'\n'}評価：{goal.evaluationAxis}
                </GoalDescription>
              </GoalCard>
            ))}
          </ChoiceArea>
        )}
      </ContentArea>
    </GameContainer>
  );
};

export default GoalSelectionScreen;
