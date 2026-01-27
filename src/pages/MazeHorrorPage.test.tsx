import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MazeHorrorPage from './MazeHorrorPage';

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
describe('MazeHorrorPage', () => {
  test('タイトル画面が正しく表示されること', () => {
    // タイトル画面で開始するため、タイトルのテキストを探す
    render(<MazeHorrorPage />);
    expect(screen.getByText('LABYRINTH')).toBeInTheDocument();
    expect(screen.getByText('OF SHADOWS')).toBeInTheDocument();
    expect(screen.getByText('〜 影の迷宮 〜')).toBeInTheDocument();
  });

  test('難易度選択ボタンが表示されていること', () => {
    render(<MazeHorrorPage />);
    expect(screen.getByText('初級')).toBeInTheDocument();
    expect(screen.getByText('中級')).toBeInTheDocument();
    expect(screen.getByText('上級')).toBeInTheDocument();
  });

  test('難易度ボタンをクリックするとゲームが開始すること', async () => {
    render(<MazeHorrorPage />);
    const easyButton = screen.getByText('初級');
    fireEvent.click(easyButton);

    // ゲーム画面に遷移し、タイトル表示が消えるはず
    await waitFor(() => {
      expect(screen.queryByText('LABYRINTH')).not.toBeInTheDocument();
    });
  });

  // Canvasなどの要素はscreen='playing'になってから表示されるため、
  // ここではタイトルのテストに留める（あるいはfireEventで遷移させる必要あり）
});
