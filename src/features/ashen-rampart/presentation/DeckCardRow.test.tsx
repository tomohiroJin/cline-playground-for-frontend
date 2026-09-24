/**
 * 構築画面の1行（DeckCardRow）のテスト（PR #211 Fix G）
 *
 * DeckBuilder から反復7 段階1 で分割されたが、コロケートされたテストが無いまま
 * 残っていた。DeckBuilder.test.tsx の検証（BUILDABLE_CARD_IDS 全13種）とは別に、
 * この行単体の増減ボタンの有効/無効・クリックの結線を見る。
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DeckCardRow } from './DeckCardRow';
import { getCardDefinition, maxCopiesOf } from '../domain/cards/card-pool';

const CARD_ID = 'arrow-tower';
const card = getCardDefinition(CARD_ID);

describe('DeckCardRow', () => {
  it('カード名と「コストN」が表示される', () => {
    render(<DeckCardRow cardId={CARD_ID} count={1} onAdd={jest.fn()} onRemove={jest.fn()} />);

    expect(screen.getByText(card.name)).toBeInTheDocument();
    expect(screen.getByText(`コスト${card.cost}`)).toBeInTheDocument();
  });

  it('枚数0のときは「1枚減らす」ボタンが無効になる', () => {
    render(<DeckCardRow cardId={CARD_ID} count={0} onAdd={jest.fn()} onRemove={jest.fn()} />);

    expect(screen.getByRole('button', { name: `${card.name} を1枚減らす` })).toBeDisabled();
  });

  it('同名上限に達すると「1枚増やす」ボタンが無効になる', () => {
    render(
      <DeckCardRow cardId={CARD_ID} count={maxCopiesOf(CARD_ID)} onAdd={jest.fn()} onRemove={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: `${card.name} を1枚増やす` })).toBeDisabled();
  });

  it('「1枚増やす」を押すと onAdd が呼ばれる', () => {
    const onAdd = jest.fn();
    render(<DeckCardRow cardId={CARD_ID} count={1} onAdd={onAdd} onRemove={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: `${card.name} を1枚増やす` }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('「1枚減らす」を押すと onRemove が呼ばれる', () => {
    const onRemove = jest.fn();
    render(<DeckCardRow cardId={CARD_ID} count={1} onAdd={jest.fn()} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: `${card.name} を1枚減らす` }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
