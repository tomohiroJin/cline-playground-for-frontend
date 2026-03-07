/**
 * 難易度選択コンポーネント
 */
import React from 'react';
import { COLORS, FONTS } from '../constants';
import { DIFFICULTY_CONFIGS } from '../difficulty';
import { Difficulty } from '../types';
import { SectionBox } from './styles';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

/** 難易度ごとの表示色 */
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: COLORS.green,
  normal: COLORS.accent,
  hard: COLORS.orange,
  extreme: COLORS.red,
};

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <SectionBox>
      <div style={{
        fontSize: 10,
        color: COLORS.muted,
        letterSpacing: 2,
        fontFamily: FONTS.mono,
        fontWeight: 700,
        marginBottom: 8,
        textAlign: 'center',
      }}>
        DIFFICULTY
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        {DIFFICULTY_CONFIGS.map(config => {
          const isSelected = value === config.id;
          const color = DIFFICULTY_COLORS[config.id];
          return (
            <button
              key={config.id}
              onClick={() => onChange(config.id)}
              title={config.description}
              style={{
                background: isSelected ? `${color}22` : `${COLORS.bg}dd`,
                border: `1px solid ${isSelected ? color : COLORS.border}`,
                color: isSelected ? color : COLORS.muted,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: isSelected ? 700 : 400,
                fontFamily: FONTS.mono,
                transition: 'all 0.2s',
                minWidth: 60,
              }}
            >
              {config.name}
            </button>
          );
        })}
      </div>
      {/* 選択中の難易度説明 */}
      <div style={{
        textAlign: 'center',
        marginTop: 6,
        fontSize: 10,
        color: COLORS.muted,
      }}>
        {DIFFICULTY_CONFIGS.find(d => d.id === value)?.description}
      </div>
    </SectionBox>
  );
};
