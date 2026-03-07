import React from 'react';
import { Difficulty, FieldConfig } from '../core/types';
import { FIELDS, DIFFICULTY_OPTIONS, DIFFICULTY_LABELS, WIN_SCORE_OPTIONS } from '../core/config';
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
  onShowAchievements?: () => void;
  onHelpClick?: () => void;
  onSettingsClick?: () => void;
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
  onShowAchievements,
  onHelpClick,
  onSettingsClick,
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
        {FIELDS.map(f => (
          <ModeButton key={f.id} onClick={() => setField(f)} $selected={field.id === f.id}>
            {f.name}
          </ModeButton>
        ))}
      </ButtonGroup>
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

    <StartButton onClick={onStart}>START</StartButton>

    <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', alignItems: 'center' }}>
      <div style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
        Best Margin: {highScore > 0 ? '+' + highScore : highScore}
      </div>
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
