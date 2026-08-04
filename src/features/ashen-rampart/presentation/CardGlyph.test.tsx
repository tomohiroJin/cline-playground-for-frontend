/**
 * 手札・デッキ構築で使う形アイコンのテスト
 *
 * 盤面の台座と同じ形を使うことが要件。ここが崩れると「持っていた札」と
 * 「置いたもの」が繋がらず、この反復の目的そのものが達成できない。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardGlyph } from './CardGlyph';
import { UnitPlate } from './UnitPlate';
import { plateKeyOf, type PlateModel } from './board-plates';
import { getUnitVisual } from './unit-visual';
import { CARD_IDS } from '../domain/cards/card-pool';

/** 盤面の座標。この検証では位置に意味はないので固定値で足りる */
const TEST_POS = { x: 0, y: 0 };
const TEST_COLUMNS = 9;
const TEST_ROWS = 7;

/**
 * cardId から UnitPlate 用の PlateModel を手で組む
 *
 * buildPlates（board-plates.ts）は CombatState から作るため、盤面に残らない
 * 呪文（mud-time）・徴発（levy）を含む14種すべてを経由させられない。
 * このテストは「盤面に置かれた実データ」ではなく「UnitPlate が visual から
 * 描く形」を見たいので、状態バーなど形に関係しない値はダミーで埋める。
 */
const plateFor = (cardId: string): PlateModel => ({
  key: plateKeyOf(TEST_POS),
  cardId,
  pos: TEST_POS,
  visual: getUnitVisual(cardId),
  statusNow: 0,
  statusMax: 0,
  statusLabel: '',
  isFiring: false,
});

describe('CardGlyph', () => {
  it('個体の文字を描く', () => {
    render(<CardGlyph cardId="ballista" />);
    expect(screen.getByText('弩')).toBeInTheDocument();
  });

  it('役割を data-role に持つ', () => {
    render(<CardGlyph cardId="mud-time" />);
    expect(screen.getByTestId('card-glyph-mud-time')).toHaveAttribute('data-role', 'spell');
  });

  it('全14種で、盤面の台座（UnitPlate）と手札の形アイコン（CardGlyph）が同じ形になる', () => {
    // getUnitVisual/getRoleClipPath を仲介させず、UnitPlate と CardGlyph を
    // 両方実際にレンダリングして DOM 属性を突き合わせる。UnitPlate が将来
    // clip-path をハードコードに変えるなど、CardGlyph と実装が分岐したら
    // このテストが落ちる。
    CARD_IDS.forEach((id) => {
      const { unmount: unmountPlate } = render(
        <UnitPlate plate={plateFor(id)} columns={TEST_COLUMNS} rows={TEST_ROWS} />
      );
      const plateEl = screen.getByTestId(`unit-plate-${TEST_POS.x}-${TEST_POS.y}`);

      const { unmount: unmountGlyph } = render(<CardGlyph cardId={id} />);
      const glyphEl = screen.getByTestId(`card-glyph-${id}`);

      expect(glyphEl.getAttribute('data-role')).toBe(plateEl.getAttribute('data-role'));
      expect(glyphEl.getAttribute('data-clip-path')).toBe(plateEl.getAttribute('data-clip-path'));
      expect(glyphEl.getAttribute('data-wide')).toBe(plateEl.getAttribute('data-wide'));

      unmountPlate();
      unmountGlyph();
    });
  });
});
