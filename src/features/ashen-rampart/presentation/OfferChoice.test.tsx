import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { OfferChoice, offerButtonLabel } from './OfferChoice';
import { getCardDefinition } from '../domain/cards/card-pool';

const OFFER = ['arrow-tower', 'stone-wall', 'ballista'];

describe('OfferChoice', () => {
  it('提示された札を1枚ずつ、名前とコストつきのボタンで出す', () => {
    render(<OfferChoice offer={OFFER} onChoose={jest.fn()} />);

    OFFER.forEach((id) => {
      const button = screen.getByRole('button', { name: offerButtonLabel(id) });
      expect(button).toHaveTextContent(getCardDefinition(id).name);
      expect(button).toHaveTextContent(`コスト${getCardDefinition(id).cost}`);
    });
  });

  it('押した札の id で onChoose が呼ばれる', () => {
    const onChoose = jest.fn();
    render(<OfferChoice offer={OFFER} onChoose={onChoose} />);

    fireEvent.click(screen.getByRole('button', { name: offerButtonLabel('stone-wall') }));

    expect(onChoose).toHaveBeenCalledWith('stone-wall');
  });

  it('辞退の手段を出さない（declineOffer は UI に出さない契約）', () => {
    render(<OfferChoice offer={OFFER} onChoose={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(OFFER.length);
  });
});
