import React from 'react';
import { ScoreBoardContainer, ScoreText, MenuButton } from '../styles';

type ScoreboardProps = {
  scores: { p: number; c: number };
  onMenuClick: () => void;
  onPauseClick?: () => void;
  cpuName?: string;
};

export const Scoreboard: React.FC<ScoreboardProps> = ({ scores, onMenuClick, onPauseClick, cpuName }) => (
  <ScoreBoardContainer>
    <ScoreText $color="#e74c3c">{cpuName ?? 'CPU'}: {scores.c}</ScoreText>
    <div style={{ display: 'flex', gap: '8px' }}>
      <MenuButton onClick={onMenuClick}>Menu</MenuButton>
      {onPauseClick && <MenuButton onClick={onPauseClick}>⏸</MenuButton>}
    </div>
    <ScoreText $color="#3498db">YOU: {scores.p}</ScoreText>
  </ScoreBoardContainer>
);
