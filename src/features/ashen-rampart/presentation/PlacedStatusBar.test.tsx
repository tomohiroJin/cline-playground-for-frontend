/**
 * 状態バーのテスト
 *
 * バーは常に1本で、意味は役割が決める（設計書 §5.1）。
 * 意味の切り替えは board-plates.ts が済ませているため、
 * ここでは「モデルどおりに描くこと」だけを検証する。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlacedStatusBar } from './PlacedStatusBar';
import { buildPlates } from './board-plates';
import type { CombatState, PlacedUnit, PlacedTrap, PlacedReactor, PlacedEmber } from '../domain/combat/combat-state';
import { createCombatState } from '../domain/combat/combat-state';
import type { DeckState } from '../domain/cards/deck';

/**
 * テスト用に必要な部分だけ持つ CombatState を組む
 *
 * 最小限の有効な DeckState で createCombatState を初期化し、
 * spread で overrides を適用する。これにより TypeScript は完全な
 * CombatState を保証し、as キャストを避けられる。
 */
const stateWith = (overrides: {
  units?: PlacedUnit[];
  traps?: PlacedTrap[];
  reactors?: PlacedReactor[];
  embers?: PlacedEmber[];
  events?: CombatState['events'];
}): CombatState => {
  const emptyDeck: DeckState = { drawPile: [], hand: [], graveyard: [] };
  const base = createCombatState(emptyDeck, []);
  return {
    ...base,
    units: overrides.units ?? [],
    traps: overrides.traps ?? [],
    reactors: overrides.reactors ?? [],
    embers: overrides.embers ?? [],
    events: overrides.events ?? [],
  };
};

describe('PlacedStatusBar', () => {
  it('守り手は残HPを progressbar として出す', () => {
    const plate = buildPlates(
      stateWith({
        units: [{ cardId: 'ballista', pos: { x: 1, y: 2 }, hp: 5, maxHp: 12, cooldownLeft: 0 }],
      })
    )[0];
    render(<PlacedStatusBar plate={plate} columns={9} rows={7} />);
    const bar = screen.getByRole('progressbar', { name: '弩砲 の耐久' });
    expect(bar).toHaveAttribute('aria-valuenow', '5');
    expect(bar).toHaveAttribute('aria-valuemax', '12');
  });

  it('罠は残り回数を出す', () => {
    const plate = buildPlates(
      stateWith({
        traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 2 }, usesLeft: 1, hitEnemyIds: [] }],
      })
    )[0];
    render(<PlacedStatusBar plate={plate} columns={9} rows={7} />);
    expect(screen.getByRole('progressbar', { name: '棘罠 の残り回数' })).toHaveAttribute(
      'aria-valuenow',
      '1'
    );
  });

  it('最大値が0のときはバーを描かない（0除算を避ける）', () => {
    const plate = buildPlates(
      stateWith({
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 0, maxHp: 0, cooldownLeft: 0 }],
      })
    )[0];
    const { container } = render(<PlacedStatusBar plate={plate} columns={9} rows={7} />);
    expect(container).toBeEmptyDOMElement();
  });
});
