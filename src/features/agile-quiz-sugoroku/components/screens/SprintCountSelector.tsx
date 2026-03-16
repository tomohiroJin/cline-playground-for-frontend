/**
 * スプリント数選択コンポーネント
 */
import React from 'react';
import { COLORS, FONTS, SPRINT_OPTIONS } from '../../constants';
import { SectionBox } from '../styles';

interface SprintCountSelectorProps {
  /** 現在の選択値 */
  value: number;
  /** 変更時のコールバック */
  onChange: (count: number) => void;
}

/**
 * スプリント数選択UI
 */
export const SprintCountSelector: React.FC<SprintCountSelectorProps> = ({ value, onChange }) => {
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
        SPRINT COUNT
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {SPRINT_OPTIONS.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              background: value === n ? `${COLORS.accent}22` : `${COLORS.bg}dd`,
              border: `1px solid ${value === n ? COLORS.accent : COLORS.border}`,
              color: value === n ? COLORS.accent : COLORS.muted,
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: value === n ? 700 : 400,
              fontFamily: FONTS.mono,
              transition: 'all 0.2s',
              minWidth: 44,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </SectionBox>
  );
};
