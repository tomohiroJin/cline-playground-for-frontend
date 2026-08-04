/**
 * 灰燼の城壁 - 設置物の状態バー
 *
 * バーは常に1本で、意味は台座の形が決める（設計書 §5.1）。守り手=残HP、
 * 罠=残り回数、燠火=再点火の進捗、魔力炉=マナ生成の進捗。プレイヤーが
 * 覚えるルールを1つに保ったまま、これまで見えなかった状態を可視化する。
 *
 * z 順序: 台座(0) < エフェクト(1) < 状態バー(2) < 敵マーカー(3)。
 * 反復2・3 と同じ理由で、エフェクトがバーを覆ってはならない。
 *
 * 幅は台座と一致させる（旧 UnitHpBar の最大HP絶対スケールから変更）。
 * サイズがコスト＝投資額を表す設計に合わせ、バーの長さの意味も揃える。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { HP_BAR_COLOR } from './enemy-visual';
import { COLORS } from './theme';

const WIDE_WIDTH_PCT = 90;

const Track = styled.div<{ $left: number; $top: number; $widthCqw: number }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  width: ${({ $widthCqw }) => $widthCqw}cqw;
  height: 3px;
  transform: translate(-50%, -50%);
  background: ${COLORS.grid};
  z-index: 2;
  pointer-events: none;
`;

const Fill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.max(0, Math.min(1, $ratio)) * 100}%;
  background: ${HP_BAR_COLOR};
`;

interface Props {
  plate: PlateModel;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
}

export const PlacedStatusBar: React.FC<Props> = ({ plate, columns, rows }) => {
  if (plate.statusMax <= 0) return null;
  const { visual, pos } = plate;
  const cellCqw = 100 / columns;
  const widthCqw = ((visual.isWide ? WIDE_WIDTH_PCT : visual.sizePct) / 100) * cellCqw;
  return (
    <Track
      data-testid={`unit-status-${pos.x}-${pos.y}`}
      role="progressbar"
      aria-valuenow={plate.statusNow}
      aria-valuemin={0}
      aria-valuemax={plate.statusMax}
      aria-label={plate.statusLabel}
      $left={((pos.x + 0.5) / columns) * 100}
      // 台座の下端へ寄せ、文字と重ねない
      $top={((pos.y + 0.82) / rows) * 100}
      $widthCqw={widthCqw}
    >
      <Fill $ratio={plate.statusNow / plate.statusMax} />
    </Track>
  );
};
