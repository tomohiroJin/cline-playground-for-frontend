/**
 * 灰燼の城壁 - 能力表示の射程リング
 *
 * 塗らずに輪郭だけ描く。敵マーカーと攻撃エフェクトを隠さないため（設計書 §5.2）。
 * 射程0のカードが3種（篝火・鍛冶場・石壁）あるため、役割で描き分ける。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { getCardDefinition } from '../domain/cards/card-pool';
import { COLORS } from './theme';

/** 支援塔のオーラは隣接1マスに及ぶ */
const AURA_RADIUS_CELLS = 1;

const Ring = styled.div<{ $left: number; $top: number; $sizeCqw: number; $round: boolean }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  width: ${({ $sizeCqw }) => $sizeCqw}cqw;
  height: ${({ $sizeCqw }) => $sizeCqw}cqw;
  transform: translate(-50%, -50%);
  border: 1px dashed ${COLORS.opportunity};
  border-radius: ${({ $round }) => ($round ? '50%' : '2px')};
  z-index: 2;
  pointer-events: none;
`;

interface Props {
  plate: PlateModel;
  columns: number;
  rows: number;
}

export const RangeOverlay: React.FC<Props> = ({ plate, columns, rows }) => {
  const tower = getCardDefinition(plate.cardId).tower;
  if (!tower) return null;
  // 壁は射程0でオーラも持たない。描くものがない
  const radiusCells = tower.range > 0 ? tower.range : tower.aura ? AURA_RADIUS_CELLS : 0;
  if (radiusCells === 0) return null;
  const cellCqw = 100 / columns;
  return (
    <Ring
      data-testid={`range-overlay-${plate.pos.x}-${plate.pos.y}`}
      data-shape={tower.range > 0 ? 'ring' : 'adjacent'}
      aria-hidden="true"
      $left={((plate.pos.x + 0.5) / columns) * 100}
      $top={((plate.pos.y + 0.5) / rows) * 100}
      // 直径 = 半径2つ分 + 自分のセル1つ分
      $sizeCqw={(radiusCells * 2 + 1) * cellCqw}
      $round={tower.range > 0}
    />
  );
};
