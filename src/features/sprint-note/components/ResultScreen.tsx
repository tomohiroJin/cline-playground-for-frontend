import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  NextButton,
  RankDisplay,
  Divider,
  EndingText,
} from './styles';
import TextReveal from './TextReveal';
import { GameState } from '../types';
import {
  evaluateGoalScore,
  determineRank,
  getResultTexts,
} from '../utils/game-logic';
import { RESULT_ENDING_TEXT } from '../constants/texts';

type ResultScreenProps = {
  state: GameState;
  onRestart: () => void;
};

// リザルト画面
const ResultScreen: React.FC<ResultScreenProps> = ({ state, onRestart }) => {
  const [showButton, setShowButton] = useState(false);

  const handleComplete = useCallback(() => {
    setShowButton(true);
  }, []);

  const goalId = state.selectedGoal?.id || 'stability';
  const goalName = state.selectedGoal?.name || '安定稼働';
  const score = evaluateGoalScore(state, goalId);
  const { rank, rankName } = determineRank(score);
  const { pmText, userText, stakeholderText, teamText } = getResultTexts(
    state,
    rank
  );

  const paragraphs = [pmText, userText, stakeholderText, teamText];

  return (
    <GameContainer>
      <PhaseHeader>── プロジェクト完了 ──</PhaseHeader>
      <ContentArea>
        <p>ゴール：{goalName}</p>
        <RankDisplay>結果：{rankName}</RankDisplay>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        <Divider />
        <EndingText>{RESULT_ENDING_TEXT}</EndingText>
      </ContentArea>
      {showButton && (
        <NextButton onClick={onRestart}>もう一度プレイする</NextButton>
      )}
    </GameContainer>
  );
};

export default ResultScreen;
