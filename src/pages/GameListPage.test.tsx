import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameListPage from './GameListPage';

// useScrollReveal で使用する API のモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
  })),
});

class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// 画像インポートのモック
jest.mock('../assets/images/puzzle_card_bg.webp', () => 'puzzle_card_bg.webp');
jest.mock('../assets/images/air_hockey_card_bg.webp', () => 'air_hockey_card_bg.webp');
jest.mock('../assets/images/non_brake_descent_card_bg.webp', () => 'non_brake_descent_card_bg.webp');
jest.mock('../assets/images/ipne_card_bg.webp', () => 'ipne_card_bg.webp');
jest.mock('../assets/images/labyrinth_echo_card_bg.webp', () => 'labyrinth_echo_card_bg.webp');
jest.mock('../assets/images/keys_and_arms_card_bg.webp', () => 'keys_and_arms_card_bg.webp');

describe('GameListPage', () => {
  it('ゲームリストページが正しくレンダリングされること', () => {
    render(
      <MemoryRouter>
        <GameListPage />
      </MemoryRouter>
    );

    // タイトルと説明文が表示されていることを確認
    expect(screen.getByText('Game Platform')).toBeInTheDocument();
    expect(screen.getByText(/厳選されたインタラクティブなゲーム体験/)).toBeInTheDocument();

    // プレイボタンが表示されていることを確認 (13ゲーム)
    expect(screen.getAllByText(/Play Now/)).toHaveLength(13);
  });

  it('迷宮の残響カードが表示されること', () => {
    render(
      <MemoryRouter>
        <GameListPage />
      </MemoryRouter>
    );

    expect(screen.getByText('迷宮の残響')).toBeInTheDocument();
    expect(screen.getByLabelText('迷宮の残響 ゲームをプレイする')).toBeInTheDocument();
  });

  it('KEYS & ARMSカードが表示されること', () => {
    render(
      <MemoryRouter>
        <GameListPage />
      </MemoryRouter>
    );

    expect(screen.getByText('KEYS & ARMS')).toBeInTheDocument();
    expect(screen.getByLabelText('KEYS & ARMS ゲームをプレイする')).toBeInTheDocument();
  });

  it('原始進化録 - PRIMAL PATHカードが表示されること', () => {
    render(
      <MemoryRouter>
        <GameListPage />
      </MemoryRouter>
    );

    expect(screen.getByText('原始進化録 - PRIMAL PATH')).toBeInTheDocument();
    expect(screen.getByLabelText('原始進化録 - PRIMAL PATH ゲームをプレイする')).toBeInTheDocument();
  });
});
