/**
 * 文明バッジコンポーネント
 * 文明タイプのバッジ表示
 */
import React from 'react';
import type { CivTypeExt } from '../../types';
import { TC, TN } from '../../constants';
import { IFS } from '../../constants/ui';

export interface CivBadgeProps {
  type: CivTypeExt;
  extra?: string;
}

export const CivBadge: React.FC<CivBadgeProps> = ({ type, extra }) => (
  <span style={{
    background: TC[type] + '18', color: TC[type], border: `1px solid ${TC[type]}40`,
    fontSize: IFS.sm, padding: '2px 6px', borderRadius: 10, display: 'inline-block',
  }}>
    {extra || ''}{TN[type]}
  </span>
);
