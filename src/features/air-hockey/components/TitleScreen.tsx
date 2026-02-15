import React from 'react';
import { Difficulty, FieldConfig, CanvasSize } from '../core/types';
import { FIELDS, DIFFICULTY_OPTIONS, DIFFICULTY_LABELS, WIN_SCORE_OPTIONS, SIZE_OPTIONS } from '../core/config';
import {
  MenuCard,
  GameTitle,
  OptionContainer,
  OptionTitle,
  ButtonGroup,
  ModeButton,
  StartButton,
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
  canvasSize: CanvasSize;
  setCanvasSize: (s: CanvasSize) => void;
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
  canvasSize,
  setCanvasSize,
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
      <OptionTitle>Size</OptionTitle>
      <ButtonGroup>
        {SIZE_OPTIONS.map(s => (
          <ModeButton key={s.id} onClick={() => setCanvasSize(s.id)} $selected={canvasSize === s.id}>
            {s.name}
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
    <div style={{ marginTop: '1rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
      Best Margin: {highScore > 0 ? '+' + highScore : highScore}
    </div>
  </MenuCard>
);
