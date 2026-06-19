import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeystoneScreen } from '../components/KeystoneScreen';
import { KEYSTONES } from '../constants';

describe('KeystoneScreen', () => {
  const picks = KEYSTONES.slice(0, 3);

  it('提示された3つのキーストーン名を表示する', () => {
    render(<KeystoneScreen picks={picks} dispatch={jest.fn()} playSfx={jest.fn()} />);
    for (const k of picks) {
      expect(screen.getByText(new RegExp(k.nm))).toBeInTheDocument();
    }
  });

  it('クリックで SELECT_KEYSTONE を id 付きで dispatch する', () => {
    const dispatch = jest.fn();
    render(<KeystoneScreen picks={picks} dispatch={dispatch} playSfx={jest.fn()} />);
    fireEvent.click(screen.getByText(new RegExp(picks[0].nm)));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SELECT_KEYSTONE', id: picks[0].id }),
    );
  });
});
