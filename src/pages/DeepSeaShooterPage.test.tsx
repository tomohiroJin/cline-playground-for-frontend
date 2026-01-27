import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeepSeaShooterPage from './DeepSeaShooterPage';

// モジュールのモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: () => <a href="/">Link</a>,
}));
// requestAnimationFrameのモック
beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
describe('DeepSeaShooterPage', () => {
  test('タイトルが正しく表示されること', () => {
    // 画面遷移状態によってはタイトルが表示されない（screen='menu'で表示されるはず）
    render(<DeepSeaShooterPage />);
    expect(screen.getByText('DEEP SEA INTERCEPTOR')).toBeInTheDocument();
  });

  test('ゲーム領域がアクセシビリティ属性を持っていること', () => {
    render(<DeepSeaShooterPage />);
    const gameArea = screen.getByRole('region', { name: /深海シューティングゲーム画面/i });
    expect(gameArea).toBeInTheDocument();
  });

  // ゲーム開始テスト
  test('GAME STARTボタンをクリックするとゲームが開始すること', async () => {
    render(<DeepSeaShooterPage />);

    // 実際のボタンテキストは "START GAME"
    const startButton = screen.getByText('START GAME');
    fireEvent.click(startButton);

    // ゲーム開始状態（タイトルが消える、またはスコア表示など）
    await waitFor(() => {
      expect(screen.queryByText('START GAME')).not.toBeInTheDocument();
    });
  });
});
