/**
 * 射程リングのテスト
 *
 * 「輪郭だけ描く」ことと、射程0の3種（篝火・鍛冶場・石壁）の描き分けを検証する。
 * 状態フィクスチャは board-plates.test.ts / PlacedStatusBar.test.tsx と同じ
 * createCombatState ベースの流儀に揃える（as unknown as CombatState は使わない）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RangeOverlay } from './RangeOverlay';
import { appliedLengthOf } from './applied-css';
import { buildPlates } from './board-plates';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { CombatState, PlacedUnit, PlacedTrap } from '../domain/combat/combat-state';
import { createCombatState } from '../domain/combat/combat-state';
import type { DeckState } from '../domain/cards/deck';

/**
 * テスト用に必要な部分だけ持つ CombatState を組む
 *
 * 最小限の有効な DeckState で createCombatState を初期化し、
 * spread で overrides を適用する。これにより TypeScript は完全な
 * CombatState を保証し、as キャストを避けられる。
 */
const stateWith = (overrides: { units?: PlacedUnit[]; traps?: PlacedTrap[] }): CombatState => {
  const emptyDeck: DeckState = { drawPile: [], hand: [], graveyard: [] };
  const base = createCombatState(emptyDeck, []);
  return {
    ...base,
    units: overrides.units ?? [],
    traps: overrides.traps ?? [],
  };
};

/** 盤面の列数と、それに対応する1セルの幅（cqw）。リングの実寸をセル数へ戻すのに使う */
const COLUMNS = 9;
const CELL_CQW = 100 / COLUMNS;

const plateForUnit = (cardId: string) =>
  buildPlates(
    stateWith({ units: [{ cardId, pos: { x: 4, y: 3 }, hp: 8, maxHp: 8, cooldownLeft: 0 }] })
  )[0];

describe('RangeOverlay', () => {
  it('射程を持つ攻撃塔は円のリングを描く', () => {
    render(<RangeOverlay plate={plateForUnit('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByTestId('range-overlay-4-3')).toHaveAttribute('data-shape', 'ring');
  });

  it('支援塔は射程0でも隣接枠を描く', () => {
    render(<RangeOverlay plate={plateForUnit('beacon')} columns={9} rows={7} />);
    expect(screen.getByTestId('range-overlay-4-3')).toHaveAttribute('data-shape', 'adjacent');
  });

  it('石壁は何も描かない（射程0・オーラなし）', () => {
    const { container } = render(<RangeOverlay plate={plateForUnit('stone-wall')} columns={9} rows={7} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each(['arrow-tower', 'piercer', 'catapult'])(
    '%s のリングの直径は射程のちょうど2倍セル（半セル分も過大にしない）',
    (cardId) => {
      // ドメインの命中判定はセル中心間のユークリッド距離で `hypot(...) <= range`。
      // マージンが無いので、`range * 2 + 1` セルで描くと半セル分だけ過大になり、
      // 「覆われて見えるのに届かないマス」が生まれる（最終レビュー指摘B）。
      // data 属性ではなく、実際に適用された width を読んで検証する。
      render(<RangeOverlay plate={plateForUnit(cardId)} columns={COLUMNS} rows={7} />);
      const ring = screen.getByTestId('range-overlay-4-3');
      const widthCqw = appliedLengthOf(ring, 'width');
      expect(widthCqw).toBeDefined();
      const range = getCardDefinition(cardId).tower!.range;
      expect(widthCqw! / CELL_CQW).toBeCloseTo(range * 2, 5);
      // 高さも同じ（円である）
      expect(appliedLengthOf(ring, 'height')).toBeCloseTo(widthCqw!, 5);
    }
  );

  it('支援塔の隣接枠は自分のセルを含む3×3（チェビシェフ距離1）', () => {
    // オーラだけは `半径2つ分 + 自分のセル1つ分` が正しい。射程と同じ式に
    // まとめ直すとここが落ちる。
    render(<RangeOverlay plate={plateForUnit('forge')} columns={COLUMNS} rows={7} />);
    const frame = screen.getByTestId('range-overlay-4-3');
    expect(appliedLengthOf(frame, 'width')! / CELL_CQW).toBeCloseTo(3, 5);
  });

  it('塔でない設置物は何も描かない', () => {
    const plate = buildPlates(
      stateWith({
        traps: [{ cardId: 'spike-trap', pos: { x: 4, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
      })
    )[0];
    const { container } = render(<RangeOverlay plate={plate} columns={9} rows={7} />);
    expect(container).toBeEmptyDOMElement();
  });
});
