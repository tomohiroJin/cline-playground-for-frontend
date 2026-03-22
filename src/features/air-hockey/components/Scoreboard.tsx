import React from 'react';
import { ScoreBoardContainer, ScoreText, MenuButton } from '../styles';
import { DEFAULT_PLAYER_MALLET_COLOR, DEFAULT_CPU_MALLET_COLOR } from '../core/constants';

type ScoreboardProps = {
  scores: { p: number; c: number };
  onMenuClick: () => void;
  onPauseClick?: () => void;
  cpuName?: string;
  /** プレイヤー名（2P 対戦用、未指定時は「YOU」） */
  playerName?: string;
  /** プレイヤースコアの色（2P 対戦用） */
  playerColor?: string;
  /** CPU スコアの色（2P 対戦用） */
  cpuColor?: string;
};

export const Scoreboard: React.FC<ScoreboardProps> = ({
  scores, onMenuClick, onPauseClick, cpuName, playerName, playerColor, cpuColor,
}) => (
  <ScoreBoardContainer>
    <ScoreText $color={cpuColor ?? DEFAULT_CPU_MALLET_COLOR}>{cpuName ?? 'CPU'}: {scores.c}</ScoreText>
    <div style={{ display: 'flex', gap: '8px' }}>
      <MenuButton onClick={onMenuClick}>Menu</MenuButton>
      {onPauseClick && <MenuButton onClick={onPauseClick}>⏸</MenuButton>}
    </div>
    <ScoreText $color={playerColor ?? DEFAULT_PLAYER_MALLET_COLOR}>{playerName ?? 'YOU'}: {scores.p}</ScoreText>
  </ScoreBoardContainer>
);
