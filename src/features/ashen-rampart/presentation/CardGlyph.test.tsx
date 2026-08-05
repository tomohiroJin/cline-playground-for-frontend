/**
 * 手札・デッキ構築で使う形アイコンのテスト
 *
 * 盤面の台座と同じ形を使うことが要件。ここが崩れると「持っていた札」と
 * 「置いたもの」が繋がらず、この反復の目的そのものが達成できない。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CardGlyph } from './CardGlyph';
import { appliedLengthOf, appliedValueOf } from './applied-css';
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
  isReady: false,
});

/**
 * 実際に適用された CSS から「どの形か」を読み取る
 *
 * clip-path があればその値そのものが形。無ければ角丸 50%（円）か
 * それ以外（角丸長方形）かで分かれる。
 */
const shapeClassOf = (element: Element): string => {
  const clipPath = appliedValueOf(element, 'clip-path');
  if (clipPath !== undefined) return `clip:${clipPath}`;
  return appliedValueOf(element, 'border-radius') === '50%' ? 'circle' : 'rounded-rect';
};

/** 実際に適用された幅と高さから「正方形か横長か」を読み取る（単位に依存しない） */
const aspectClassOf = (element: Element): string =>
  appliedLengthOf(element, 'width') === appliedLengthOf(element, 'height') ? 'square' : 'wide';

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
    // **実際に適用された CSS** を突き合わせる。以前はテストのためだけに置いた
    // data-clip-path / data-wide を比べていたため、形を決める transient prop
    // （$clipPath）だけを undefined に変えると、手札のアイコンが全部円になるのに
    // 3つのアサーションは通ってしまった（最終レビュー指摘H-5）。
    CARD_IDS.forEach((id) => {
      const { unmount: unmountPlate } = render(
        <UnitPlate plate={plateFor(id)} columns={TEST_COLUMNS} rows={TEST_ROWS} />
      );
      const plateEl = screen.getByTestId(`unit-plate-${TEST_POS.x}-${TEST_POS.y}`);
      const shapeEl = screen.getByTestId(`unit-shape-${TEST_POS.x}-${TEST_POS.y}`);

      const { unmount: unmountGlyph } = render(<CardGlyph cardId={id} />);
      const glyphEl = screen.getByTestId(`card-glyph-${id}`);

      expect(glyphEl.getAttribute('data-role')).toBe(plateEl.getAttribute('data-role'));
      // 形（多角形か、円か、角丸長方形か）
      expect(shapeClassOf(glyphEl)).toBe(shapeClassOf(shapeEl));
      // 縦横比の種別（横長は石壁だけ）。盤面は cqw、手札は px と単位が違うため
      // 絶対値ではなく「正方形か横長か」を比べる
      expect(aspectClassOf(glyphEl)).toBe(aspectClassOf(plateEl));

      unmountPlate();
      unmountGlyph();
    });
  });
});
