import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RacingGamePage from './RacingGamePage';

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

describe('RacingGamePage', () => {
  test('タイトル画面が正しく表示されること', () => {
    render(<RacingGamePage />);
    expect(screen.getByText(/racing game/i)).toBeInTheDocument();
  });

  test('Canvasがアクセシビリティ属性を持っていること', () => {
    render(<RacingGamePage />);
    const canvas = screen.getByRole('img', { name: /レーシングゲーム画面/i });
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('tabIndex', '0');
  });

  test('スタートボタンが表示されていること', () => {
    // Menu画面なのでスタートボタンがあるはず
    render(<RacingGamePage />);
    const startButton = screen.getByText('🏁 スタート!');
    expect(startButton).toBeInTheDocument();
  });

  test('設定オプションが表示されていること', () => {
    render(<RacingGamePage />);
    // コース選択肢の一部
    const forests = screen.getAllByText('🌳フォレスト');
    expect(forests.length).toBeGreaterThan(0);
    // スピード選択肢の一部 (s.label.split(' ')[0] が表示されるため、アイコンのみ)
    const cars = screen.getAllByText('🚗ふつう');
    expect(cars.length).toBeGreaterThan(0);
  });
  test('スタートボタンをクリックするとゲーム状態が遷移すること', async () => {
    render(<RacingGamePage />);
    const startButton = screen.getByText('🏁 スタート!');
    fireEvent.click(startButton);

    // Countdown状態になるため、スタートボタンは消えるはず
    await waitFor(() => {
      expect(screen.queryByText('🏁 スタート!')).not.toBeInTheDocument();
    });
  });
});
