import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameListPage from './GameListPage';

// 画像インポートのモック
jest.mock('../assets/images/puzzle_card_bg.webp', () => 'puzzle_card_bg.webp');
jest.mock('../assets/images/air_hockey_card_bg.webp', () => 'air_hockey_card_bg.webp');
jest.mock(
  '../assets/images/non_brake_descent_card_bg.webp',
  () => 'non_brake_descent_card_bg.webp'
);
jest.mock('../assets/images/ipne_mvp0_card_bg.webp', () => 'ipne_mvp0_card_bg.webp');

describe('GameListPage', () => {
  test('タイトルと説明文が表示されること', () => {
    render(
      <MemoryRouter>
        <GameListPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Game Platform')).toBeInTheDocument();
    expect(screen.getByText(/厳選されたインタラクティブなゲーム体験/)).toBeInTheDocument();
  });

  test('全8個のゲームカードが表示されること', () => {
    render(
      <MemoryRouter>
        <GameListPage />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Play Now/)).toHaveLength(8);
  });
});
