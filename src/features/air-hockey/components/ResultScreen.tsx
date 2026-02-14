import React from 'react';
import { ShareButton } from '../../../components/molecules/ShareButton';
import { MenuCard, GameTitle, StartButton } from '../styles';

type ResultScreenProps = {
  winner: string | null;
  scores: { p: number; c: number };
  onBackToMenu: () => void;
};

export const ResultScreen: React.FC<ResultScreenProps> = ({ winner, scores, onBackToMenu }) => (
  <MenuCard>
    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
      {winner === 'player' ? '🎉' : '😢'}
    </div>
    <GameTitle style={{ color: winner === 'player' ? 'var(--accent-color)' : '#ff4444' }}>
      {winner === 'player' ? 'YOU WIN!' : 'YOU LOSE'}
    </GameTitle>
    <p style={{ fontSize: '2rem', color: 'white', fontWeight: 'bold', marginBottom: '20px' }}>
      {scores.p} - {scores.c}
    </p>
    <div style={{ marginBottom: '1.5rem' }}>
      <ShareButton
        text={`Air Hockeyで${winner === 'player' ? '勝利' : '敗北'}！ スコア: ${scores.p} - ${scores.c}`}
        hashtags={['AirHockey', 'GamePlatform']}
      />
    </div>
    <StartButton onClick={onBackToMenu}>BACK TO MENU</StartButton>
  </MenuCard>
);
