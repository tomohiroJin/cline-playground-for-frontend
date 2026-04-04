/**
 * プログレスバーコンポーネント
 * ラベル付きの汎用プログレスバー
 */
import React from 'react';

export interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label }) => {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div style={{ width: '100%', marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#605848', marginBottom: 1 }}>
        <span>{label}</span><span>{current}/{max}</span>
      </div>
      <div style={{ background: '#1a1a22', height: 6, borderRadius: 3, overflow: 'hidden', border: '1px solid #1a1a28' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#f0c040,#f08040)', borderRadius: 3, transition: 'width .4s', width: `${pct}%` }} />
      </div>
    </div>
  );
};
