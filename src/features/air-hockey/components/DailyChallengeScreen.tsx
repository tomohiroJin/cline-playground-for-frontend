import React from 'react';
import { MenuCard, GameTitle, StartButton, MenuButton } from '../styles';
import { DailyChallenge, DailyChallengeResult } from '../core/daily-challenge';
import { DIFFICULTY_LABELS } from '../core/config';
import { FIELDS } from '../core/config';

type DailyChallengeScreenProps = {
  challenge: DailyChallenge;
  result?: DailyChallengeResult;
  onStart: () => void;
  onBack: () => void;
};

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = ({
  challenge,
  result,
  onStart,
  onBack,
}) => {
  const field = FIELDS.find(f => f.id === challenge.fieldId);
  const isCleared = result?.isCleared;

  return (
    <MenuCard>
      <GameTitle>Daily Challenge</GameTitle>
      <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {challenge.date}
      </p>

      <div style={{
        width: '100%',
        padding: '16px',
        marginBottom: '1rem',
        background: 'rgba(255, 165, 0, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 165, 0, 0.3)',
      }}>
        <h3 style={{ color: '#ffa500', marginBottom: '8px', textAlign: 'center' }}>
          {challenge.title}
        </h3>
        <div style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.6' }}>
          <p>Field: {field?.name ?? challenge.fieldId}</p>
          <p>Difficulty: {DIFFICULTY_LABELS[challenge.difficulty]}</p>
          <p>Win Score: {challenge.winScore}</p>
          {challenge.modifiers.map((m, i) => (
            <p key={i} style={{ color: '#ffa500' }}>
              {m.description}
            </p>
          ))}
        </div>
      </div>

      {isCleared && result && (
        <div style={{
          marginBottom: '1rem',
          padding: '8px 20px',
          background: 'rgba(0, 255, 136, 0.15)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 255, 136, 0.4)',
          textAlign: 'center',
        }}>
          <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
            CLEARED! {result.playerScore} - {result.cpuScore}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <StartButton onClick={onStart}>
          {isCleared ? 'REPLAY' : 'START'}
        </StartButton>
        <MenuButton onClick={onBack}>BACK</MenuButton>
      </div>
    </MenuCard>
  );
};
