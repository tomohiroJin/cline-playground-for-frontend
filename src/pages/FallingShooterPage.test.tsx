import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FallingShooterPage from './FallingShooterPage';

// モジュールのモック
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// requestAnimationFrameのモック
beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('FallingShooterPage', () => {
  test('タイトルが正しく表示されること', () => {
    render(<FallingShooterPage />);
    const titles = screen.getAllByText('落ち物シューティング');
    expect(titles.length).toBeGreaterThan(0);
  });

  test('ゲーム領域がアクセシビリティ属性を持っていること', () => {
    render(<FallingShooterPage />);
    const gameArea = screen.getByRole('region', { name: /シューティングパズルゲーム画面/i });
    expect(gameArea).toBeInTheDocument();
  });

  test('必要なUI要素が表示されていること', () => {
    render(<FallingShooterPage />);
    // ヘッダーアイコン
    expect(screen.getByText('🔊')).toBeInTheDocument(); // Sound enabled by default
    expect(screen.getByText('❓')).toBeInTheDocument(); // Help button

    // コントロールボタン
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('スタートボタンをクリックするとゲームが開始すること', async () => {
    render(<FallingShooterPage />);
    // スタートボタン（"Start"）を探してクリック
    // 初期状態は 'idle' で StartScreen が表示されているはず
    const startButton = screen.getByText('Start');
    expect(startButton).toBeInTheDocument();

    // クリック
    fireEvent.click(startButton);

    // Startボタンが消えることを確認
    await waitFor(() => {
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
    });
  });
});
