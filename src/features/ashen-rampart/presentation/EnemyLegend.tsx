/**
 * 灰燼の城壁 - 敵の凡例
 *
 * 1周目の観察で「敵の種類名は表示されていない」「バーの色が種別なのか残量なのか
 * 判別できない」と指摘された。形と名前と HP を対応表として常時示し、
 * 盤面のマーカーが何者かを引けるようにする。
 */
import React from 'react';
import styled from 'styled-components';
import { getEnemySpec } from '../domain/combat/enemies';
import { getEnemyVisual, getShapeClipPath } from './enemy-visual';

/** 平原ステージに登場する敵 */
const ENEMY_IDS = ['grunt', 'runner', 'brute'] as const;

const Panel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #241d22;
  border-radius: 8px;
  color: #e8ded2;
  font-size: 13px;
`;

const Item = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const Swatch = styled.span<{ $color: string; $clip?: string; $size: number }>`
  display: inline-block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
  flex-shrink: 0;
`;

const Hp = styled.span`
  color: #b9a892;
`;

export const EnemyLegend: React.FC = () => (
  <Panel aria-label="敵の凡例">
    {ENEMY_IDS.map((id) => {
      const visual = getEnemyVisual(id);
      const spec = getEnemySpec(id);
      return (
        <Item key={id}>
          <Swatch
            $color={visual.color}
            $clip={getShapeClipPath(visual.shape)}
            // 盤面のサイズ差（雑兵 < 重装）を凡例でも保つ
            $size={Math.round(visual.sizePct * 2.2)}
            aria-hidden="true"
          />
          {visual.name}
          <Hp>HP{spec.hp}</Hp>
        </Item>
      );
    })}
  </Panel>
);
