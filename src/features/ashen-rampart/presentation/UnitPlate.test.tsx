/**
 * 台座の描画テスト
 *
 * 台座は「形（役割）× サイズ（コスト）× 文字（個体）」を担う。
 * 敵マーカーと混同しないよう pointer-events を持たず、セルのボタンが
 * クリックを受ける（UnitHpBar と同じ方針）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UnitPlate } from './UnitPlate';
import { buildPlates } from './board-plates';
import type { CombatState, PlacedUnit } from '../domain/combat/combat-state';
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
  traps?: never[];
  reactors?: never[];
  embers?: never[];
}): CombatState => {
  const emptyDeck: DeckState = { drawPile: [], hand: [], graveyard: [] };
  const base = createCombatState(emptyDeck, []);
  return {
    ...base,
    units: overrides.units ?? [],
    traps: [],
    reactors: [],
    embers: [],
    events: [],
  };
};

const plateFor = (cardId: string) =>
  buildPlates(stateWith({ units: [{ cardId, pos: { x: 2, y: 3 }, hp: 8, maxHp: 8, cooldownLeft: 0 }] }))[0];

describe('UnitPlate', () => {
  it('個体を表す文字を描く', () => {
    render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByText('弓')).toBeInTheDocument();
  });

  it('役割と個体名を aria-label に持つ', () => {
    render(<UnitPlate plate={plateFor('arrow-tower')} columns={9} rows={7} />);
    expect(screen.getByLabelText('攻撃塔 弓兵')).toBeInTheDocument();
  });

  it('石壁は横長プレートになる', () => {
    render(<UnitPlate plate={plateFor('stone-wall')} columns={9} rows={7} />);
    expect(screen.getByTestId('unit-plate-2-3')).toHaveAttribute('data-wide', 'true');
  });

  it('攻撃塔以外は data-role で区別できる', () => {
    render(<UnitPlate plate={plateFor('beacon')} columns={9} rows={7} />);
    expect(screen.getByTestId('unit-plate-2-3')).toHaveAttribute('data-role', 'support');
  });
});
