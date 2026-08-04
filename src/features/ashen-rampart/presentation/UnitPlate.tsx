/**
 * 灰燼の城壁 - 設置物の台座
 *
 * 形＝役割、サイズ＝コスト、文字＝個体の3重符号を描く（設計書 §4）。
 * 敵マーカーが「動く小さな塗り」なのに対し、台座は「固定された大きな枠」で
 * 図と地を分ける。クリックは下のセルボタンが受けるため pointer-events を持たない。
 *
 * z 順序: 台座(0) < エフェクト(1) < 状態バー(2) < 敵マーカー(3)。
 * 台座はセルの地であり、攻撃エフェクトを隠してはならない。
 */
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { PlateModel } from './board-plates';
import { getRoleClipPath, roleLabelOf } from './unit-visual';
import { COLORS } from './theme';

/** 撃った瞬間だけ脈動させる。装飾ではなく「今起きたこと」の合図 */
const firePulse = keyframes`
  from { opacity: 0.95; }
  to { opacity: 0.45; }
`;

const PLATE_BACKGROUND = 'rgba(232, 222, 210, 0.14)';

/** 石壁の横長プレート。セル辺に対する幅・高さの割合（%） */
const WIDE_WIDTH_PCT = 90;
const WIDE_HEIGHT_PCT = 45;

const Plate = styled.div<{
  $left: number;
  $top: number;
  $widthCqw: number;
  $heightCqw: number;
  $wide: boolean;
  $clipPath?: string;
  $firing: boolean;
}>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  transform: translate(-50%, -50%);
  width: ${({ $widthCqw }) => $widthCqw}cqw;
  height: ${({ $heightCqw }) => $heightCqw}cqw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${PLATE_BACKGROUND};
  border: 1px solid ${COLORS.secondary};
  border-radius: ${({ $wide, $clipPath }) => ($wide ? '4px' : $clipPath ? '0' : '50%')};
  ${({ $clipPath }) => ($clipPath ? css`clip-path: ${$clipPath};` : '')}
  color: ${COLORS.secondary};
  font-size: 12px;
  line-height: 1;
  z-index: 0;
  pointer-events: none;

  ${({ $firing }) =>
    $firing
      ? css`
          animation: ${firePulse} 150ms ease-out alternate 2;
        `
      : ''}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

interface Props {
  plate: PlateModel;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
}

export const UnitPlate: React.FC<Props> = ({ plate, columns, rows }) => {
  const { visual, pos } = plate;
  // sizePct は「セル辺に対する割合」だが、cqw は「盤面幅に対する割合」。
  // セル辺は盤面幅の 1/columns なので、両者を掛けて cqw へ換算する。
  // 単位を混ぜると横長プレートだけ縮尺が狂うため、ここで一度に確定させる。
  const cellCqw = 100 / columns;
  const widthCqw = ((visual.isWide ? WIDE_WIDTH_PCT : visual.sizePct) / 100) * cellCqw;
  const heightCqw = ((visual.isWide ? WIDE_HEIGHT_PCT : visual.sizePct) / 100) * cellCqw;
  // CardGlyph（手札）と同じ値を data-clip-path に出す。$clipPath と別々に計算すると
  // 「盤面と手札で同じ形か」を DOM 突き合わせで検証するテストが意味を失うため、
  // 必ずこの1つの変数から両方を出す。
  const clipPath = getRoleClipPath(visual.role);
  return (
    <Plate
      data-testid={`unit-plate-${pos.x}-${pos.y}`}
      data-role={visual.role}
      data-wide={visual.isWide ? 'true' : 'false'}
      data-clip-path={clipPath ?? 'none'}
      aria-label={`${roleLabelOf(visual.role)} ${visual.name}`}
      $left={((pos.x + 0.5) / columns) * 100}
      $top={((pos.y + 0.44) / rows) * 100}
      $widthCqw={widthCqw}
      $heightCqw={heightCqw}
      $wide={visual.isWide}
      $clipPath={clipPath}
      $firing={plate.isFiring}
    >
      {visual.glyph}
    </Plate>
  );
};
