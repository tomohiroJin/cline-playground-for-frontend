import React from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import TitleScreen from './TitleScreen';
import ProjectIntroScreen from './ProjectIntroScreen';
import TeamFormationScreen from './TeamFormationScreen';
import GoalSelectionScreen from './GoalSelectionScreen';
import PlanningScreen from './PlanningScreen';
import DevelopmentScreen from './DevelopmentScreen';
import ReleaseScreen from './ReleaseScreen';
import ReviewScreen from './ReviewScreen';
import RetrospectiveScreen from './RetrospectiveScreen';
import ResultScreen from './ResultScreen';

// Sprint Note メインゲームコンポーネント（フェーズルーター）
const SprintNoteGame: React.FC = () => {
  const {
    state,
    advancePhase,
    selectGoal,
    selectTasks,
    selectRelease,
    selectImprovement,
    restart,
  } = useGameEngine();

  switch (state.currentPhase) {
    case 'TITLE':
      return <TitleScreen onStart={advancePhase} />;
    case 'PROJECT_INTRO':
      return <ProjectIntroScreen onNext={advancePhase} />;
    case 'TEAM_FORMATION':
      return <TeamFormationScreen onNext={advancePhase} />;
    case 'GOAL_SELECTION':
      return <GoalSelectionScreen onSelectGoal={selectGoal} />;
    case 'PLANNING':
      return (
        <PlanningScreen
          sprint={state.currentSprint}
          onSelectTasks={selectTasks}
        />
      );
    case 'DEVELOPMENT':
      return <DevelopmentScreen state={state} onNext={advancePhase} />;
    case 'RELEASE':
      return <ReleaseScreen state={state} onSelectRelease={selectRelease} />;
    case 'REVIEW':
      return <ReviewScreen state={state} onNext={advancePhase} />;
    case 'RETROSPECTIVE':
      return (
        <RetrospectiveScreen
          state={state}
          onSelectImprovement={selectImprovement}
          onAdvance={advancePhase}
        />
      );
    case 'RESULT':
      return <ResultScreen state={state} onRestart={restart} />;
    default:
      return null;
  }
};

export default SprintNoteGame;
