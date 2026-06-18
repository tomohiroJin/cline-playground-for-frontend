import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TotemSelectScreen } from '../components/TotemSelectScreen';
import { FRESH_SAVE } from '../constants';

const baseSave = { ...FRESH_SAVE, tree: {}, best: {} };

describe('TotemSelectScreen', () => {
  it('解放済みトーテム（基本3種）を表示する', () => {
    render(
      <TotemSelectScreen
        save={baseSave}
        pendingStart={{ di: 0, loopOverride: 0 }}
        dispatch={jest.fn()}
        playSfx={jest.fn()}
      />,
    );
    expect(screen.getByText(/血の祖/)).toBeInTheDocument();
    expect(screen.getByText(/炎の祖/)).toBeInTheDocument();
    expect(screen.getByText(/群れの祖/)).toBeInTheDocument();
  });

  it('トーテムをクリックすると START_RUN を totemId 付きで dispatch する', () => {
    const dispatch = jest.fn();
    render(
      <TotemSelectScreen
        save={baseSave}
        pendingStart={{ di: 2, loopOverride: 1 }}
        dispatch={dispatch}
        playSfx={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/血の祖/));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'START_RUN', di: 2, loopOverride: 1, totemId: 'blood' }),
    );
  });

  it('challengeId 有の場合 START_CHALLENGE を dispatch する', () => {
    const dispatch = jest.fn();
    render(
      <TotemSelectScreen
        save={baseSave}
        pendingStart={{ di: 0, loopOverride: 0, challengeId: 'hp_half' }}
        dispatch={dispatch}
        playSfx={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/炎の祖/));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'START_CHALLENGE', challengeId: 'hp_half', di: 0, totemId: 'flame' }),
    );
  });
});
