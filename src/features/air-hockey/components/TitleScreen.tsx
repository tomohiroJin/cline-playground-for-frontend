import React from 'react';
import { Difficulty, FieldConfig } from '../core/types';
import { FIELDS, DIFFICULTY_OPTIONS, DIFFICULTY_LABELS, WIN_SCORE_OPTIONS } from '../core/config';
import { AudioSettings } from '../core/audio-settings';
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
  bgmEnabled?: boolean;
  onToggleBgm?: () => void;
  audioSettings?: AudioSettings;
  onAudioSettingsChange?: (settings: AudioSettings) => void;
  onShowAchievements?: () => void;
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
  bgmEnabled = false,
  onToggleBgm,
  audioSettings,
  onAudioSettingsChange,
  onShowAchievements,
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

    {onToggleBgm && (
      <OptionContainer>
        <OptionTitle>BGM</OptionTitle>
        <ButtonGroup>
          <ModeButton onClick={onToggleBgm} $selected={bgmEnabled}>
            {bgmEnabled ? 'ON' : 'OFF'}
          </ModeButton>
        </ButtonGroup>
      </OptionContainer>
    )}

    {/* 音量設定 */}
    {audioSettings && onAudioSettingsChange && (
      <OptionContainer>
        <OptionTitle>Volume</OptionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '40px' }}>BGM</span>
          <input
            type="range"
            min={0}
            max={100}
            value={audioSettings.bgmVolume}
            onChange={e => onAudioSettingsChange({ ...audioSettings, bgmVolume: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '30px', textAlign: 'right' }}>{audioSettings.bgmVolume}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '40px' }}>SE</span>
          <input
            type="range"
            min={0}
            max={100}
            value={audioSettings.seVolume}
            onChange={e => onAudioSettingsChange({ ...audioSettings, seVolume: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '30px', textAlign: 'right' }}>{audioSettings.seVolume}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ModeButton
            onClick={() => onAudioSettingsChange({ ...audioSettings, muted: !audioSettings.muted })}
            $selected={audioSettings.muted}
          >
            {audioSettings.muted ? 'MUTED' : 'MUTE'}
          </ModeButton>
        </div>
      </OptionContainer>
    )}

    <StartButton onClick={onStart}>START</StartButton>

    <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', alignItems: 'center' }}>
      <div style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
        Best Margin: {highScore > 0 ? '+' + highScore : highScore}
      </div>
      {onShowAchievements && (
        <MenuButton onClick={onShowAchievements}>実績</MenuButton>
      )}
    </div>
  </MenuCard>
);
