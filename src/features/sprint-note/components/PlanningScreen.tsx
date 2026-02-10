import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  ChoiceArea,
  ChoiceButton,
} from './styles';
import TextReveal from './TextReveal';
import { Task } from '../types';
import { SPRINT_TASKS, getTaskCombinations } from '../constants/tasks';
import { getSprintPhaseHeader } from '../constants/texts';

type PlanningScreenProps = {
  sprint: number;
  onSelectTasks: (tasks: Task[]) => void;
};

// スプリントプランニング画面
const PlanningScreen: React.FC<PlanningScreenProps> = ({
  sprint,
  onSelectTasks,
}) => {
  const [showChoices, setShowChoices] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();

  const tasks = SPRINT_TASKS[sprint] || [];
  const combinations = getTaskCombinations(sprint);

  const handleComplete = useCallback(() => {
    setShowChoices(true);
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (selectedIndex !== undefined) return;
      setSelectedIndex(index);
      setTimeout(() => onSelectTasks([...combinations[index]]), 500);
    },
    [selectedIndex, combinations, onSelectTasks]
  );

  const paragraphs = [
    '今スプリントで取り組むタスクを2つ選んでください。',
    ...tasks.map(
      (t, i) => `${i + 1}. ${t.name}\n   ${t.description}`
    ),
  ];

  const header = getSprintPhaseHeader(sprint, 'プランニング');

  return (
    <GameContainer>
      <PhaseHeader>── {header} ──</PhaseHeader>
      <ContentArea>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        {showChoices && (
          <ChoiceArea>
            {combinations.map((combo, i) => (
              <ChoiceButton
                key={i}
                $selected={selectedIndex === i}
                $disabled={selectedIndex !== undefined && selectedIndex !== i}
                onClick={() => handleSelect(i)}
                disabled={selectedIndex !== undefined}
              >
                {combo[0].name} と {combo[1].name}
              </ChoiceButton>
            ))}
          </ChoiceArea>
        )}
      </ContentArea>
    </GameContainer>
  );
};

export default PlanningScreen;
