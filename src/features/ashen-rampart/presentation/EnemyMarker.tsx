/**
 * 灰燼の城壁 - 敵マーカー
 *
 * 形・サイズ・色の3重符号で敵種を示し、HPバーは最大HPの絶対スケールで描く。
 * 束ねた場合は体数バッジを添える（設計書 §9.3）。
 */
import React from 'react';
import styled from 'styled-components';
import type { EnemyStack } from './enemy-stack';
import {
  getEnemyVisual,
  getHpBarWidthPct,
  getShapeClipPath,
  HP_BAR_COLOR,
} from './enemy-visual';
import { COLORS } from './theme';

const Wrapper = styled.div<{ $left: number; $top: number }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
`;

const Body = styled.div<{ $size: number; $color: string; $clip?: string; $ring?: string }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
  box-shadow: ${({ $ring }) => ($ring ? `0 0 0 2px ${$ring}` : 'none')};
`;

const BarTrack = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  height: 3px;
  background: ${COLORS.grid};
`;

const BarFill = styled.div<{ $ratio: number }>`
  width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  height: 100%;
  background: ${HP_BAR_COLOR};
`;

const Badge = styled.span`
  font-size: 10px;
  color: ${COLORS.secondary};
  background: ${COLORS.dominant};
  padding: 0 3px;
  border-radius: 3px;
`;

interface Props {
  stack: EnemyStack;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
  /** 盤面の実寸（px） */
  boardWidth: number;
}

export const EnemyMarker: React.FC<Props> = ({ stack, columns, rows, boardWidth }) => {
  const visual = getEnemyVisual(stack.enemyId);
  const size = (visual.sizePct / 100) * boardWidth;
  const barWidth = (getHpBarWidthPct(stack.maxHp) / 100) * boardWidth;
  const label =
    stack.count > 1 ? `${visual.name} ${stack.count}体` : visual.name;
  return (
    <Wrapper
      $left={((stack.pos.x + 0.5) / columns) * 100}
      $top={((stack.pos.y + 0.5) / rows) * 100}
      role="img"
      aria-label={label}
    >
      <Body
        $size={size}
        $color={visual.color}
        $clip={getShapeClipPath(visual.shape)}
        $ring={visual.ringColor}
      />
      <BarTrack $width={barWidth}>
        <BarFill $ratio={stack.maxHp === 0 ? 0 : stack.hp / stack.maxHp} />
      </BarTrack>
      {stack.count > 1 && <Badge>×{stack.count}</Badge>}
    </Wrapper>
  );
};
