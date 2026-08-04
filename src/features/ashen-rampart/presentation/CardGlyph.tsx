/**
 * 灰燼の城壁 - カードの形アイコン
 *
 * 盤面の台座（UnitPlate）と同じ形・同じ文字を、手札とデッキ構築でも使う。
 * 手札のアイコンと盤面のアイコンが一致して初めて「自分が置いたものが何か」
 * が繋がる（設計書 §6）。呪文と徴発は盤面に残らないため、この2形は
 * 手札とデッキ構築にしか現れない。
 */
import React from 'react';
import styled, { css } from 'styled-components';
import { getRoleClipPath, getUnitVisual } from './unit-visual';

const GLYPH_SIZE_PX = 18;
const GLYPH_BACKGROUND = 'rgba(232, 222, 210, 0.14)';

const Glyph = styled.span<{ $clipPath?: string; $wide: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: ${GLYPH_SIZE_PX}px;
  height: ${({ $wide }) => ($wide ? GLYPH_SIZE_PX * 0.6 : GLYPH_SIZE_PX)}px;
  background: ${GLYPH_BACKGROUND};
  border: 1px solid currentColor;
  border-radius: ${({ $wide, $clipPath }) => ($wide ? '2px' : $clipPath ? '0' : '50%')};
  ${({ $clipPath }) => ($clipPath ? css`clip-path: ${$clipPath};` : '')}
  font-size: 10px;
  line-height: 1;
`;

interface Props {
  cardId: string;
}

export const CardGlyph: React.FC<Props> = ({ cardId }) => {
  const visual = getUnitVisual(cardId);
  const clipPath = getRoleClipPath(visual.role);
  return (
    <Glyph
      data-testid={`card-glyph-${cardId}`}
      data-role={visual.role}
      data-clip-path={clipPath ?? 'none'}
      aria-hidden="true"
      $clipPath={clipPath}
      $wide={visual.isWide}
    >
      {visual.glyph}
    </Glyph>
  );
};
