/**
 * HPバーコンポーネント
 * プレイヤー/敵のHP表示用
 */
import React from 'react';

export interface HpBarProps {
  value: number;
  max: number;
  variant: 'hp' | 'eh';
  showPct?: boolean;
  low?: boolean;
}

export const HpBar: React.FC<HpBarProps> = ({ value, max, variant, showPct, low }) => {
  const pct = Math.max(0, (value / max) * 100);
  const bg = variant === 'hp' ? 'linear-gradient(180deg,#5e5,#2a2)' : 'linear-gradient(180deg,#e55,#a22)';
  return (
    <div style={{ background: '#16161e', height: 14, width: '100%', border: '1px solid #2a2a3a', position: 'relative', borderRadius: 2, overflow: 'hidden', margin: '2px 0' }}>
      <div style={{
        height: '100%', transition: 'width .3s', width: `${pct}%`, background: low ? 'linear-gradient(180deg,#e55,#a22)' : bg,
        ...(low ? { animation: 'barPulse .8s infinite' } : {}),
      }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', textAlign: 'center', fontSize: 9, lineHeight: '14px', color: '#fff', textShadow: '0 1px 2px #000' }}>
        {Math.max(0, value)}/{max}{showPct ? ` (${Math.round(pct)}%)` : ''}
      </div>
    </div>
  );
};
