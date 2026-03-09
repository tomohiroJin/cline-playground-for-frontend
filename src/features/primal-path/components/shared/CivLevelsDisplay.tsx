/**
 * 文明レベル表示コンポーネント
 * 技術・生命・儀式の各文明レベルを表示
 */
import React from 'react';
import type { RunState } from '../../types';
import { Tc, Lc, Rc } from '../../styles';

export interface CivLevelsDisplayProps {
  run: RunState;
}

export const CivLevelsDisplay: React.FC<CivLevelsDisplayProps> = ({ run }) => (
  <span>
    <Tc>技{run.cT}</Tc> / <Lc>生{run.cL}</Lc> / <Rc>儀{run.cR}</Rc>
  </span>
);
