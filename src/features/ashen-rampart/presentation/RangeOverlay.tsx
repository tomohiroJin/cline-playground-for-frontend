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

/** 支援塔のオーラは隣接1マス（チェビシェフ距離1）に及ぶ */
const AURA_RADIUS_CELLS = 1;

/**
 * オーラの枠の一辺（セル数）
 *
 * チェビシェフ距離1は自分のセルを含む 3×3 の正方形なので、
 * 半径2つ分に自分のセル1つ分を足す。
 */
const AURA_SIZE_CELLS = AURA_RADIUS_CELLS * 2 + 1;

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
  const isRing = tower.range > 0;
  // 壁は射程0でオーラも持たない。描くものがない
  if (!isRing && !tower.aura) return null;
  /*
    射程とオーラは距離の測り方が違うため、大きさの式を共有してはいけない。

    射程: ドメインはセル中心間のユークリッド距離で `hypot(...) <= range` と
      判定する（step-tick.ts）。マージンは無いので、直径はちょうど
      「半径2つ分」= `range * 2` セル。ここに自分のセル1つ分を足すと
      半セル分だけ過大になり、「覆われて見えるのに届かないマス」が生まれる。
    オーラ: チェビシェフ距離1の 3×3 なので、自分のセルを含めた
      `AURA_SIZE_CELLS` セルの正方形が正しい。
  */
  const sizeCells = isRing ? tower.range * 2 : AURA_SIZE_CELLS;
  const cellCqw = 100 / columns;
  return (
    <Ring
      data-testid={`range-overlay-${plate.pos.x}-${plate.pos.y}`}
      data-shape={isRing ? 'ring' : 'adjacent'}
      aria-hidden="true"
      $left={((plate.pos.x + 0.5) / columns) * 100}
      $top={((plate.pos.y + 0.5) / rows) * 100}
      $sizeCqw={sizeCells * cellCqw}
      $round={isRing}
    />
  );
};
