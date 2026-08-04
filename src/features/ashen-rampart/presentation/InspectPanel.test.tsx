/**
 * 能力チップのテスト
 *
 * 盤面に出さない詳細（攻撃力・射程・対空可否・攻撃の形など）を
 * 役割ごとに正しく組み立てられることを検証する。状態フィクスチャは
 * board-plates.test.ts / PlacedStatusBar.test.tsx と同じ createCombatState
 * ベースの流儀に揃える（as unknown as CombatState は使わない）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InspectPanel } from './InspectPanel';
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
const stateWith = (overrides: { units?: PlacedUnit[] }): CombatState => {
  const emptyDeck: DeckState = { drawPile: [], hand: [], graveyard: [] };
  const base = createCombatState(emptyDeck, []);
  return {
    ...base,
    units: overrides.units ?? [],
  };
};

const plateFor = (cardId: string) =>
  buildPlates(
    stateWith({ units: [{ cardId, pos: { x: 0, y: 0 }, hp: 8, maxHp: 8, cooldownLeft: 0 }] })
  )[0];

describe('InspectPanel', () => {
  it('攻撃塔は攻撃力・射程・対空可否・攻撃の形を出す', () => {
    render(<InspectPanel plate={plateFor('piercer')} />);
    expect(screen.getByText('攻撃塔 徹甲弩')).toBeInTheDocument();
    expect(screen.getByText('飛行に当たる')).toBeInTheDocument();
    expect(screen.getByText('貫通')).toBeInTheDocument();
  });

  it('支援塔は強化内容を出す', () => {
    render(<InspectPanel plate={plateFor('forge')} />);
    expect(screen.getByText('隣接の射程 +0.6')).toBeInTheDocument();
  });

  it('石壁は攻撃しないことを明示する', () => {
    render(<InspectPanel plate={plateFor('stone-wall')} />);
    expect(screen.getByText('攻撃しない')).toBeInTheDocument();
  });
});
