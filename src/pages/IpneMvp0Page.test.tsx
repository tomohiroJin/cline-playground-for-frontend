import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IpneMvp0Page, { ClearScreen } from './IpneMvp0Page';

// requestAnimationFrameのモック
beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    cb(0);
    return 1;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('IpneMvp0Page', () => {
  describe('タイトル画面', () => {
    test('タイトル画面が正しく表示されること', () => {
      render(<IpneMvp0Page />);
      expect(screen.getByRole('button', { name: /ゲームを開始/i })).toBeInTheDocument();
    });

    test('ゲーム開始ボタンをクリックするとプロローグ画面に遷移すること', async () => {
      render(<IpneMvp0Page />);
      const startButton = screen.getByRole('button', { name: /ゲームを開始/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /ゲームを開始/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('プロローグ画面', () => {
    test('プロローグ画面でスキップボタンが表示されること', async () => {
      render(<IpneMvp0Page />);
      // タイトル画面からプロローグへ遷移
      fireEvent.click(screen.getByRole('button', { name: /ゲームを開始/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });
    });
  });

  describe('ゲーム画面', () => {
    test('ゲーム画面にCanvasが表示されること', async () => {
      render(<IpneMvp0Page />);
      // タイトル→プロローグ→ゲームへ遷移
      fireEvent.click(screen.getByRole('button', { name: /ゲームを開始/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /スキップ/i }));

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /ゲーム画面/i })).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    test('ゲーム領域に適切なaria属性が設定されていること', async () => {
      render(<IpneMvp0Page />);
      fireEvent.click(screen.getByRole('button', { name: /ゲームを開始/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /スキップ/i }));

      await waitFor(() => {
        const gameRegion = screen.getByRole('region', { name: /ゲーム/i });
        expect(gameRegion).toBeInTheDocument();
      });
    });
  });

  describe('画面遷移の状態初期化', () => {
    test('タイトルから開始した場合、正しく初期化されること', () => {
      render(<IpneMvp0Page />);

      // タイトル画面が表示される（ゲーム開始ボタンで確認）
      expect(screen.getByRole('button', { name: /ゲームを開始/i })).toBeInTheDocument();
    });

    test('プロローグをスキップ後、ゲーム画面が表示されること', async () => {
      render(<IpneMvp0Page />);

      // タイトル→プロローグ
      fireEvent.click(screen.getByRole('button', { name: /ゲームを開始/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });

      // プロローグ→ゲーム
      fireEvent.click(screen.getByRole('button', { name: /スキップ/i }));
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /ゲーム/i })).toBeInTheDocument();
      });
    });
  });
});

describe('ClearScreen', () => {
  test('クリア画面が正しく表示されること', () => {
    const mockRetry = jest.fn();
    const mockBackToTitle = jest.fn();

    render(<ClearScreen onRetry={mockRetry} onBackToTitle={mockBackToTitle} />);

    // クリアメッセージが表示される
    expect(screen.getByText(/クリア/)).toBeInTheDocument();
    expect(screen.getByText(/おめでとうございます/)).toBeInTheDocument();
  });

  test('リトライボタンが表示され、クリックでコールバックが呼ばれること', () => {
    const mockRetry = jest.fn();
    const mockBackToTitle = jest.fn();

    render(<ClearScreen onRetry={mockRetry} onBackToTitle={mockBackToTitle} />);

    const retryButton = screen.getByRole('button', { name: /もう一度プレイ/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  test('タイトルに戻るボタンが表示され、クリックでコールバックが呼ばれること', () => {
    const mockRetry = jest.fn();
    const mockBackToTitle = jest.fn();

    render(<ClearScreen onRetry={mockRetry} onBackToTitle={mockBackToTitle} />);

    const backButton = screen.getByRole('button', { name: /タイトルに戻る/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockBackToTitle).toHaveBeenCalledTimes(1);
  });
});
