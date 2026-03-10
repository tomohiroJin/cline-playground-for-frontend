import React from 'react';
import { Difficulty, FieldConfig } from '../core/types';
import { FIELDS, DIFFICULTY_OPTIONS, DIFFICULTY_LABELS, WIN_SCORE_OPTIONS } from '../core/config';
import { UnlockState, UNLOCK_CONDITIONS } from '../core/unlock';
import {
  MenuCard,
  GameTitle,
  OptionContainer,
  OptionTitle,
  ButtonGroup,
  ModeButton,
  StartButton,
  MenuButton,
} from '../styles';

type TitleScreenProps = {
  diff: Difficulty;
  setDiff: (d: Difficulty) => void;
  field: FieldConfig;
  setField: (f: FieldConfig) => void;
  winScore: number;
  setWinScore: (s: number) => void;
  highScore: number;
  onStart: () => void;
  onStoryClick?: () => void;
  onShowAchievements?: () => void;
  onHelpClick?: () => void;
  onSettingsClick?: () => void;
  onDailyChallengeClick?: () => void;
  unlockState?: UnlockState;
};

export const TitleScreen: React.FC<TitleScreenProps> = ({
  diff,
  setDiff,
  field,
  setField,
  winScore,
  setWinScore,
  highScore,
  onStart,
  onStoryClick,
  onShowAchievements,
  onHelpClick,
  onSettingsClick,
  onDailyChallengeClick,
  unlockState,
}) => (
  <MenuCard>
    <GameTitle>🏒 Air Hockey</GameTitle>

    <OptionContainer>
      <OptionTitle>Difficulty</OptionTitle>
      <ButtonGroup>
        {DIFFICULTY_OPTIONS.map(d => (
          <ModeButton key={d} onClick={() => setDiff(d)} $selected={diff === d}>
            {DIFFICULTY_LABELS[d]}
          </ModeButton>
        ))}
      </ButtonGroup>
    </OptionContainer>

    <OptionContainer>
      <OptionTitle>Field</OptionTitle>
      <ButtonGroup>
        {FIELDS.map(f => {
          const isLocked = unlockState && !unlockState.unlockedFields.includes(f.id);
          const unlockCond = UNLOCK_CONDITIONS.find(c => c.type === 'field' && c.targetId === f.id);
          const tooltip = isLocked && unlockCond ? `🔒 ${unlockCond.description}` : f.name;
          return (
            <ModeButton
              key={f.id}
              onClick={() => !isLocked && setField(f)}
              $selected={field.id === f.id}
              style={isLocked ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              title={tooltip}
            >
              {isLocked ? `🔒` : f.name}
            </ModeButton>
          );
        })}
      </ButtonGroup>
      {/* ロック中フィールドの解放条件を表示 */}
      {unlockState && FIELDS.some(f => !unlockState.unlockedFields.includes(f.id)) && (
        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px', textAlign: 'center' }}>
          {FIELDS.filter(f => !unlockState.unlockedFields.includes(f.id)).map(f => {
            const cond = UNLOCK_CONDITIONS.find(c => c.type === 'field' && c.targetId === f.id);
            return cond ? `${f.name}: ${cond.description}` : '';
          }).filter(Boolean).join(' / ')}
        </div>
      )}
    </OptionContainer>

    <OptionContainer>
      <OptionTitle>Win Score</OptionTitle>
      <ButtonGroup>
        {WIN_SCORE_OPTIONS.map(s => (
          <ModeButton key={s} onClick={() => setWinScore(s)} $selected={winScore === s}>
            {s}
          </ModeButton>
        ))}
      </ButtonGroup>
    </OptionContainer>

    <StartButton onClick={onStart}>フリー対戦</StartButton>

    {onStoryClick && (
      <StartButton
        onClick={onStoryClick}
        style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', marginTop: '10px' }}
      >
        ストーリー
      </StartButton>
    )}

    <div style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '1rem' }}>
      Best Margin: {highScore > 0 ? '+' + highScore : highScore}
    </div>
    <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      {onDailyChallengeClick && (
        <MenuButton onClick={onDailyChallengeClick}>Daily Challenge</MenuButton>
      )}
      {onShowAchievements && (
        <MenuButton onClick={onShowAchievements}>実績</MenuButton>
      )}
      {onHelpClick && (
        <MenuButton onClick={onHelpClick}>?</MenuButton>
      )}
      {onSettingsClick && (
        <MenuButton onClick={onSettingsClick}>&#9881;</MenuButton>
      )}
    </div>
  </MenuCard>
);
