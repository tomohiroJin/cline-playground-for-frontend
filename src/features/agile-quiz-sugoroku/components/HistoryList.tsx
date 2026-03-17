/**
 * 履歴一覧表示コンポーネント
 */
import React from 'react';
import { COLORS, FONTS } from '../constants';
import { SectionBox } from './styles';

interface HistoryEntry {
  timestamp: number;
  grade: string;
  correctRate: number;
  teamTypeName: string;
}

interface HistoryListProps {
  history: HistoryEntry[];
}

/** 日付をフォーマット */
function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 履歴一覧テーブル */
export const HistoryList: React.FC<HistoryListProps> = ({ history }) => (
  <SectionBox style={{ maxHeight: '30vh', overflowY: 'auto' }}>
    <div style={{
      fontSize: 11, color: COLORS.muted, fontWeight: 700,
      marginBottom: 8, fontFamily: FONTS.mono, letterSpacing: 1,
    }}>
      直近の結果
    </div>
    {[...history].reverse().map((entry, i) => (
      <div
        key={entry.timestamp}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 8px', borderRadius: 6,
          background: i === 0 ? `${COLORS.accent}08` : 'transparent',
          border: `1px solid ${i === 0 ? `${COLORS.accent}15` : COLORS.border}`,
          marginBottom: 4, fontSize: 11,
        }}
      >
        <span style={{ fontFamily: FONTS.mono, color: COLORS.muted, minWidth: 44 }}>
          {formatDate(entry.timestamp)}
        </span>
        <span style={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.accent, minWidth: 24 }}>
          {entry.grade}
        </span>
        <span style={{ color: COLORS.text }}>
          正答率 {entry.correctRate}%
        </span>
        <span style={{ color: COLORS.muted, marginLeft: 'auto' }}>
          {entry.teamTypeName}
        </span>
      </div>
    ))}
  </SectionBox>
);
