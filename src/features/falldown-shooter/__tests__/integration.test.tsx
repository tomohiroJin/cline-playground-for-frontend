import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FalldownShooterGame } from '../FalldownShooterGame';

// ShareButton のモック
jest.mock('../../../components/molecules/ShareButton', () => ({
  ShareButton: () => <button data-testid="share-button">Share</button>,
}));

// Audio のモック
jest.mock('../audio', () => ({
  Audio: {
    shoot: jest.fn(),
    hit: jest.fn(),
    land: jest.fn(),
    line: jest.fn(),
    power: jest.fn(),
    bomb: jest.fn(),
    over: jest.fn(),
    win: jest.fn(),
    skill: jest.fn(),
    charge: jest.fn(),
  },
}));

// score-storage のモック
jest.mock('../../../utils/score-storage', () => ({
  saveScore: jest.fn().mockResolvedValue(undefined),
  getHighScore: jest.fn().mockResolvedValue(0),
  getScores: jest.fn().mockResolvedValue([]),
}));

jest.useFakeTimers();

describe('FalldownShooterGame 統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ゲーム開始フロー', () => {
    test('初期状態でスタート画面が表示されること', () => {
      render(<FalldownShooterGame />);
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    test('Startボタンクリックでゲームが開始されること', async () => {
      render(<FalldownShooterGame />);
      fireEvent.click(screen.getByText('Start'));

      await waitFor(() => {
        expect(screen.queryByText('Start')).not.toBeInTheDocument();
      });
    });

    test('ゲーム開始後にステータスバーが表示されること', async () => {
      render(<FalldownShooterGame />);
      fireEvent.click(screen.getByText('Start'));

      await waitFor(() => {
        expect(screen.getByText('ST1')).toBeInTheDocument();
      });
    });
  });

  describe('UI要素', () => {
    test('サウンドトグルボタンが動作すること', () => {
      render(<FalldownShooterGame />);

      // 初期状態: サウンド ON
      expect(screen.getByText('🔊')).toBeInTheDocument();

      // クリックで OFF
      fireEvent.click(screen.getByText('🔊'));
      expect(screen.getByText('🔇')).toBeInTheDocument();

      // 再クリックで ON
      fireEvent.click(screen.getByText('🔇'));
      expect(screen.getByText('🔊')).toBeInTheDocument();
    });

    test('ヘルプボタンクリックでデモ画面が表示されること', () => {
      render(<FalldownShooterGame />);
      fireEvent.click(screen.getByText('❓'));
      // デモ画面のコンテンツが表示される
      expect(screen.getByText('🎮 遊び方')).toBeInTheDocument();
    });

    test('コントロールボタンが表示されること', () => {
      render(<FalldownShooterGame />);
      expect(screen.getByText('←')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    test('難易度セレクターが表示されること', () => {
      render(<FalldownShooterGame />);
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });
  });

  describe('スキルゲージ', () => {
    test('初期状態で0%が表示されること', () => {
      render(<FalldownShooterGame />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('ハイスコア表示', () => {
    test('ハイスコアが表示されること', async () => {
      render(<FalldownShooterGame />);
      await waitFor(() => {
        expect(screen.getByText(/High Score/)).toBeInTheDocument();
      });
    });
  });

  describe('デモ画面', () => {
    test('アイドル状態でデモが自動表示されること', () => {
      render(<FalldownShooterGame />);

      // 8秒アイドル
      act(() => {
        jest.advanceTimersByTime(8000);
      });

      expect(screen.getByText('🎮 遊び方')).toBeInTheDocument();
    });

    test('デモ画面クリックで閉じること', () => {
      render(<FalldownShooterGame />);

      // デモを表示
      fireEvent.click(screen.getByText('❓'));
      expect(screen.getByText('🎮 遊び方')).toBeInTheDocument();

      // デモコンテナをクリック（DemoContainerのonClick）
      const demoTitle = screen.getByText('🎮 遊び方');
      // 親のDemoContainer要素をクリック
      fireEvent.click(demoTitle.closest('div')!.parentElement!.parentElement!);
    });
  });

  describe('ポーズ機能', () => {
    test('ゲーム中にEscapeキーでポーズ画面が表示されること', async () => {
      render(<FalldownShooterGame />);

      // ゲームを開始
      fireEvent.click(screen.getByText('Start'));
      await waitFor(() => {
        expect(screen.queryByText('Start')).not.toBeInTheDocument();
      });

      // Escapeキーでポーズ
      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      await waitFor(() => {
        expect(screen.getByText(/PAUSED/)).toBeInTheDocument();
      });
    });

    test('ポーズ中にResumeボタンでゲームが再開されること', async () => {
      render(<FalldownShooterGame />);

      // ゲームを開始
      fireEvent.click(screen.getByText('Start'));
      await waitFor(() => {
        expect(screen.queryByText('Start')).not.toBeInTheDocument();
      });

      // Escapeキーでポーズ
      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      await waitFor(() => {
        expect(screen.getByText(/PAUSED/)).toBeInTheDocument();
      });

      // Resumeボタンでゲーム再開
      fireEvent.click(screen.getByText(/Resume/));
      await waitFor(() => {
        expect(screen.queryByText(/PAUSED/)).not.toBeInTheDocument();
      });
    });

    test('ポーズ中にTitleボタンでタイトルに戻ること', async () => {
      render(<FalldownShooterGame />);

      // ゲームを開始
      fireEvent.click(screen.getByText('Start'));
      await waitFor(() => {
        expect(screen.queryByText('Start')).not.toBeInTheDocument();
      });

      // Escapeキーでポーズ
      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      await waitFor(() => {
        expect(screen.getByText(/PAUSED/)).toBeInTheDocument();
      });

      // Titleボタンでタイトルに戻る
      fireEvent.click(screen.getByText(/Title/));
      await waitFor(() => {
        expect(screen.getByText('Start')).toBeInTheDocument();
      });
    });
  });

  describe('難易度選択', () => {
    test('難易度を変更できること', () => {
      render(<FalldownShooterGame />);

      // 初期状態: Normal が選択されている
      const normalBtn = screen.getByText('Normal');
      expect(normalBtn).toBeInTheDocument();

      // Easy に変更
      fireEvent.click(screen.getByText('Easy'));

      // Easy が選択状態に（ボタンが存在し続けること）
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    test('Hard を選択してゲームを開始できること', async () => {
      render(<FalldownShooterGame />);

      // Hard に変更
      fireEvent.click(screen.getByText('Hard'));

      // ゲームを開始
      fireEvent.click(screen.getByText('Start'));
      await waitFor(() => {
        expect(screen.queryByText('Start')).not.toBeInTheDocument();
      });
    });
  });

  describe('ランキング機能', () => {
    test('スタート画面からランキングを表示できること', async () => {
      render(<FalldownShooterGame />);

      // ランキングボタン（🏆）をクリック
      const trophyButtons = screen.getAllByText('🏆');
      fireEvent.click(trophyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/ランキング/)).toBeInTheDocument();
      });
    });

    test('ランキング画面でCloseボタンで閉じられること', async () => {
      render(<FalldownShooterGame />);

      // ランキング画面を開く
      const trophyButtons = screen.getAllByText('🏆');
      fireEvent.click(trophyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/ランキング/)).toBeInTheDocument();
      });

      // Closeボタンで閉じる
      fireEvent.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText(/ランキング/)).not.toBeInTheDocument();
      });
    });

    test('スコアがない場合にメッセージが表示されること', async () => {
      render(<FalldownShooterGame />);

      // ランキング画面を開く
      const trophyButtons = screen.getAllByText('🏆');
      fireEvent.click(trophyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('スコアがありません')).toBeInTheDocument();
      });
    });
  });
});
