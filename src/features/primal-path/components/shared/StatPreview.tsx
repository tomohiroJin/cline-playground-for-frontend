/**
 * ステータスプレビューコンポーネント
 * 進化選択時のステータス変化プレビュー表示
 */
import React from 'react';

export interface StatPreviewProps {
  label: string;
  current: number;
  next: number;
  max: number;
  color: string;
}

export const StatPreview: React.FC<StatPreviewProps> = ({ label, current, next, max, color }) => {
  const pC = Math.min(100, (current / max) * 100);
  const pN = Math.min(100, (next / max) * 100);
  const diff = next - current;
  const baseW = Math.min(pC, pN);
  const deltaStart = next > current ? pC : next < current ? pN : 0;
  const deltaW = Math.abs(pN - pC);
  const deltaColor = next > current ? '#50e090' : next < current ? '#f05050' : 'transparent';

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', margin: '1px 0', fontSize: 11 }}>
      <div style={{ width: 22, color: '#988070', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 5, background: '#1a1a22', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', borderRadius: 3, position: 'absolute', top: 0, left: 0, transition: 'width .2s', width: `${baseW}%`, background: color }} />
        <div style={{ height: '100%', borderRadius: 3, position: 'absolute', top: 0, left: `${deltaStart}%`, width: `${deltaW}%`, background: deltaColor, opacity: 0.7 }} />
      </div>
      <div style={{ minWidth: 52, color: '#908870', fontSize: 11, flexShrink: 0, textAlign: 'right' }}>
        {next}{' '}
        {diff > 0 ? <span style={{ color: '#50e090' }}>+{diff}</span>
          : diff < 0 ? <span style={{ color: '#f05050' }}>{diff}</span>
          : <span style={{ color: '#988070' }}>±0</span>}
      </div>
    </div>
  );
};
