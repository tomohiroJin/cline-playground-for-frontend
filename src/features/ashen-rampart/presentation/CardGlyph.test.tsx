/**
 * 手札・デッキ構築で使う形アイコンのテスト
 *
 * 盤面の台座と同じ形を使うことが要件。ここが崩れると「持っていた札」と
 * 「置いたもの」が繋がらず、この反復の目的そのものが達成できない。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardGlyph } from './CardGlyph';
import { getRoleClipPath, getUnitVisual } from './unit-visual';
import { CARD_IDS } from '../domain/cards/card-pool';

describe('CardGlyph', () => {
  it('個体の文字を描く', () => {
    render(<CardGlyph cardId="ballista" />);
    expect(screen.getByText('弩')).toBeInTheDocument();
  });

  it('役割を data-role に持つ', () => {
    render(<CardGlyph cardId="mud-time" />);
    expect(screen.getByTestId('card-glyph-mud-time')).toHaveAttribute('data-role', 'spell');
  });

  it('全14種が描画でき、盤面の台座と同じ役割・形を使う', () => {
    CARD_IDS.forEach((id) => {
      const { unmount } = render(<CardGlyph cardId={id} />);
      const el = screen.getByTestId(`card-glyph-${id}`);
      const visual = getUnitVisual(id);
      expect(el).toHaveAttribute('data-role', visual.role);
      expect(el).toHaveAttribute('data-clip-path', getRoleClipPath(visual.role) ?? 'none');
      unmount();
    });
  });
});
