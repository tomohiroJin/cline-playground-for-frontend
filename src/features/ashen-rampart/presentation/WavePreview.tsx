/**
 * 灰燼の城壁 - 次ウェーブ予告
 *
 * 「何が来るか」が読めなければ配置は賭けになる。
 * ウェーブ構成は乱数を使わず事前定義されているため、開示しても崩れない。
 */
import React from 'react';
import styled from 'styled-components';
import { PLAINS_WAVES } from '../domain/combat/waves';
import { getEnemySpec } from '../domain/combat/enemies';

const Panel = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #2a2029;
  border: 1px solid #6b4a3a;
  border-radius: 8px;
  color: #e8ded2;
  font-size: 14px;
`;

const Label = styled.span`
  color: #e8b04b;
  font-weight: bold;
`;

const Entry = styled.span`
  padding: 2px 8px;
  background: #3a2c33;
  border-radius: 4px;
`;

interface Props {
  /** 次に戦うウェーブの添字（0始まり） */
  waveIndex: number;
}

export const WavePreview: React.FC<Props> = ({ waveIndex }) => {
  const wave = PLAINS_WAVES[waveIndex];
  if (!wave) return null;

  return (
    <Panel>
      <Label>
        次のウェーブ {waveIndex + 1}/{PLAINS_WAVES.length}
      </Label>
      {wave.entries.map((entry) => (
        <Entry key={entry.enemyId}>
          {getEnemySpec(entry.enemyId).name} ×{entry.count}
        </Entry>
      ))}
    </Panel>
  );
};
