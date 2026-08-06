/**
 * 灰燼の城壁 - 敵の凡例
 *
 * S1 の教訓: 形を描き分けても、記号を意味に接続する索引が無いと
 * 「赤丸とオレンジ菱形がある」止まりになる。凡例は必須。
 *
 * 反復5: 一部の敵は経路の脇に置いた守り手も攻撃するようになった。
 * 射程が見えなければ、経路外は安全という前提が裏切られ理不尽な事故になる。
 */
import React from 'react';
import styled from 'styled-components';
import { ENEMY_IDS, getEnemySpec } from '../domain/combat/enemies';
import { getEnemyVisual, getShapeClipPath } from './enemy-visual';
import { COLORS } from './theme';

const List = styled.ul`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 8px;
  color: ${COLORS.secondary};
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
`;

const Swatch = styled.span<{ $color: string; $clip?: string }>`
  width: 12px;
  height: 12px;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
`;

const Stat = styled.span`
  color: ${COLORS.secondary};
`;

const Note = styled.p`
  margin: 0;
  padding: 0 8px 8px;
  font-size: 11px;
  color: ${COLORS.secondary};
`;

export const EnemyLegend: React.FC = () => (
  <>
    <List aria-label="敵の凡例">
      {ENEMY_IDS.map((id) => {
        const visual = getEnemyVisual(id);
        const spec = getEnemySpec(id);
        return (
          <Item key={id}>
            <Swatch $color={visual.color} $clip={getShapeClipPath(visual.shape)} />
            <span>
              {visual.name}
              {spec.flying ? '（飛行・弩砲のみ有効）' : ''}
            </span>
            {spec.attackRange > 0 && <Stat>射程 {spec.attackRange}</Stat>}
          </Item>
        );
      })}
    </List>
    <Note>射程を持つ敵は、経路の脇に置いた守り手も削ります。</Note>
  </>
);
