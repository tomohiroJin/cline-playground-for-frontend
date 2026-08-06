/**
 * 灰燼の城壁 - 敵マーカー
 *
 * 形・サイズ・色の3重符号で敵種を示し、HPバーは最大HPの絶対スケールで描く。
 * 束ねた場合は体数バッジを添える
 * （PoC 設計書 2026-07-29-ashen-rampart-realtime-deck-poc-design.md §9.3）。
 *
 * **セル座標を絶対配置するだけで、重なりを避けるオフセットは持たない。**
 * 同種は enemy-stack.ts が束ねるが、異種が同一位置に来ると完全に重なる。
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
  /* z 順序: セル(0) < エフェクト(1) < 守り手のHPバー(2) < 敵マーカー(3)。
     反復3 で守り手のHPバーが z-index:2 に入ったため、敵マーカーは
     さらに上の 3 に押し上げる（エフェクト・守り手HPのどちらにも埋もれない） */
  z-index: 3;
`;

/**
 * sizePct / HPバー幅は「盤面幅に対する割合（%）」として定義されている。
 * Frame 側で container-type: inline-size を宣言しているため、cqw
 * （コンテナのインライン方向サイズの1%）を使えば px 換算なしにそのまま
 * 盤面幅に追従するサイズになる。盤面が 360px まで縮んでも符号の比率が
 * 崩れない（設計書 §9.7 最小対応幅 360px）。
 */
const Body = styled.div<{ $sizePct: number; $color: string; $clip?: string; $ring?: string }>`
  width: ${({ $sizePct }) => $sizePct}cqw;
  height: ${({ $sizePct }) => $sizePct}cqw;
  background: ${({ $color }) => $color};
  clip-path: ${({ $clip }) => $clip ?? 'none'};
  border-radius: ${({ $clip }) => ($clip ? '0' : '50%')};
  box-shadow: ${({ $ring }) => ($ring ? `0 0 0 2px ${$ring}` : 'none')};
`;

const BarTrack = styled.div<{ $widthPct: number }>`
  width: ${({ $widthPct }) => $widthPct}cqw;
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
}

export const EnemyMarker: React.FC<Props> = ({ stack, columns, rows }) => {
  const visual = getEnemyVisual(stack.enemyId);
  const barWidthPct = getHpBarWidthPct(stack.maxHp);
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
        $sizePct={visual.sizePct}
        $color={visual.color}
        $clip={getShapeClipPath(visual.shape)}
        $ring={visual.ringColor}
      />
      <BarTrack $widthPct={barWidthPct}>
        <BarFill $ratio={stack.maxHp === 0 ? 0 : stack.hp / stack.maxHp} />
      </BarTrack>
      {stack.count > 1 && <Badge>×{stack.count}</Badge>}
    </Wrapper>
  );
};
