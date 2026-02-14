import React from 'react';
import { ScoreBoardContainer, ScoreText, MenuButton } from '../styles';

type ScoreboardProps = {
  scores: { p: number; c: number };
  onMenuClick: () => void;
};

export const Scoreboard: React.FC<ScoreboardProps> = ({ scores, onMenuClick }) => (
  <ScoreBoardContainer>
    <ScoreText $color="#e74c3c">CPU: {scores.c}</ScoreText>
    <MenuButton onClick={onMenuClick}>Menu</MenuButton>
    <ScoreText $color="#3498db">YOU: {scores.p}</ScoreText>
  </ScoreBoardContainer>
);
