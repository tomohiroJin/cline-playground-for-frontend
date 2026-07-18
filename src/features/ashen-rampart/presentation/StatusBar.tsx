/**
 * 灰燼の城壁 - ステータスバー（ライフ/マナ/ウェーブ/スコア）
 */
import React from 'react';
import styled from 'styled-components';
import { PLAINS_WAVES } from '../domain/combat/waves';
import type { RunState } from '../domain/run/run-state';

const Bar = styled.div`
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: #241d22;
  color: #e8ded2;
  border-radius: 8px;
  font-size: 14px;
`;

export const StatusBar: React.FC<{ run: RunState }> = ({ run }) => (
  <Bar>
    <span data-testid="status-life">❤️ {run.life}</span>
    <span data-testid="status-mana">🔮 {run.mana}/{run.manaMax}</span>
    <span data-testid="status-wave">
      🌊 {Math.min(run.waveIndex + 1, PLAINS_WAVES.length)}/{PLAINS_WAVES.length}
    </span>
    <span data-testid="status-score">⭐ {run.score}</span>
  </Bar>
);
