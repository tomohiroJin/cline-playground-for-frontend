/**
 * 相性バッジコンポーネント
 * バイオームと文明レベルの相性表示
 */
import React from 'react';
import type { BiomeIdExt, CivLevels } from '../../types';
import { biomeBonus } from '../../game-logic';

export interface AffinityBadgeProps {
  biome: BiomeIdExt;
  levels: CivLevels;
}

export const AffinityBadge: React.FC<AffinityBadgeProps> = ({ biome, levels }) => {
  if (biome === 'final') return null;
  const afn = biomeBonus(biome, levels);
  return afn > 1
    ? <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 6, display: 'inline-block', marginLeft: 3, color: '#50e090', background: '#50e09015', border: '1px solid #50e09030' }}>相性◎ ×{afn}</span>
    : <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 6, display: 'inline-block', marginLeft: 3, color: '#605848', background: '#60584810', border: '1px solid #60584820' }}>相性─</span>;
};
