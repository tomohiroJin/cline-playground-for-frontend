/**
 * ステータスライン表示コンポーネント
 * HP/ATK/DEFの概要表示
 */
import React from 'react';
import type { RunState } from '../../types';
import { effATK } from '../../game-logic';
import { Tc } from '../../styles';

export interface StatLineProps {
  run: RunState;
}

export const StatLine: React.FC<StatLineProps> = ({ run }) => (
  <span>
    HP <span style={{ color: '#e0d8c8' }}>{run.hp}/{run.mhp}</span>{' '}
    ATK <Tc>{effATK(run)}</Tc>{' '}
    DEF <span style={{ color: '#50c8e8' }}>{run.def}</span>
  </span>
);
