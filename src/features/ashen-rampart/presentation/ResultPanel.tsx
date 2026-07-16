/**
 * 灰燼の城壁 - リザルトパネル
 */
import React from 'react';
import styled from 'styled-components';
import type { RunState } from '../domain/run/run-state';

const Panel = styled.div`
  text-align: center;
  color: #e8ded2;
  padding: 24px;
`;

export const ResultPanel: React.FC<{ run: RunState; onRestart: () => void }> = ({
  run,
  onRestart,
}) => (
  <Panel>
    <h2>{run.status === 'won' ? '🏰 砦は守られた' : '💀 城壁は灰燼に帰した'}</h2>
    <p>スコア: {run.score}</p>
    <button onClick={onRestart}>もう一度挑む</button>
  </Panel>
);
