import React from 'react';
import { ScoreBoardContainer, ScoreText, MenuButton } from '../styles';

type ScoreboardProps = {
  scores: { p: number; c: number };
  onMenuClick: () => void;
  onPauseClick?: () => void;
  onHelpClick?: () => void;
};

export const Scoreboard: React.FC<ScoreboardProps> = ({ scores, onMenuClick, onPauseClick, onHelpClick }) => (
  <ScoreBoardContainer>
    <ScoreText $color="#e74c3c">CPU: {scores.c}</ScoreText>
    <div style={{ display: 'flex', gap: '8px' }}>
      <MenuButton onClick={onMenuClick}>Menu</MenuButton>
      {onPauseClick && <MenuButton onClick={onPauseClick}>⏸</MenuButton>}
      {onHelpClick && <MenuButton onClick={onHelpClick}>?</MenuButton>}
    </div>
    <ScoreText $color="#3498db">YOU: {scores.p}</ScoreText>
  </ScoreBoardContainer>
);
