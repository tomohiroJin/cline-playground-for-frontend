/**
 * 覚醒バッジコンポーネント
 * 取得済み覚醒のバッジ一覧表示
 */
import React from 'react';
import type { AwokenRecord } from '../../types';

export interface AwakeningBadgesProps {
  awoken: AwokenRecord[];
}

export const AwakeningBadges: React.FC<AwakeningBadgesProps> = ({ awoken }) => (
  <>
    {awoken.map(a => (
      <span key={a.id} style={{
        fontSize: 11, padding: '1px 5px', borderRadius: 8, display: 'inline-block', margin: '1px',
        background: a.cl + '20', color: a.cl, border: `1px solid ${a.cl}40`,
      }}>
        {a.nm}
      </span>
    ))}
  </>
);
