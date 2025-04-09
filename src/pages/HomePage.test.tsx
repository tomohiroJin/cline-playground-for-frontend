import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HomePage from './HomePage';
import { useGameState } from '../hooks/useGameState';
import { getClearHistory } from '../utils/storage-utils';

// モックの設定
jest.mock('../hooks/useGameState');
jest.mock('../utils/storage-utils');
jest.mock('../components/molecules/ClearHistoryList', () => {
  return {
    __esModule: true,
    default: ({ history }: { history: any[] }) => (
      <div data-testid="clear-history-list">
        {history.length > 0 ? (
          <ul>
            {history.map((item, index) => (
              <li key={index} data-testid="history-item">
                {item.imageName} - {item.clearTime}
              </li>
            ))}
          </ul>
        ) : (
          <div>クリア履歴はありません</div>
        )}
      </div>
    ),
  };
});

describe('HomePage', () => {
  // モックの初期化
  beforeEach(() => {
    // useGameStateのモック
    (useGameState as jest.Mock).mockReturnValue({
      toggleHintMode: jest.fn(),
      gameStarted: false,
      imageSourceMode: 'upload',
      setImageSourceMode: jest.fn(),
      handleImageUpload: jest.fn(),
      handleDifficultyChange: jest.fn(),
      handleStartGame: jest.fn(),
      handlePieceMove: jest.fn(),
      handleResetGame: jest.fn(),
      handleEndGame: jest.fn(),
      handleEmptyPanelClick: jest.fn(),
      gameState: {
        imageUrl: null,
        originalImageSize: null,
        pieces: [],
        division: 4,
        elapsedTime: 0,
        completed: false,
        hintModeEnabled: false,
        emptyPosition: null,
        emptyPanelClicks: 0,
        setPieces: jest.fn(),
        setCompleted: jest.fn(),
      },
    });

    // getClearHistoryのモック
    (getClearHistory as jest.Mock).mockReturnValue([]);
  });

  // テスト後のクリーンアップ
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 基本的なレンダリングテスト
  it('基本的なコンポーネントがレンダリングされる', () => {
    render(<HomePage />);

    // 遊び方の説明が表示されていることを確認
    expect(screen.getByText('遊び方')).toBeInTheDocument();
    expect(screen.getByText(/画像をアップロードするか/)).toBeInTheDocument();
  });

  // クリア履歴表示のテスト（履歴なし）
  it('クリア履歴がない場合は「クリア履歴はありません」と表示される', async () => {
    render(<HomePage />);

    // クリア履歴リストが表示されていることを確認
    const historyList = screen.getByTestId('clear-history-list');
    expect(historyList).toBeInTheDocument();

    // 「クリア履歴はありません」が表示されていることを確認
    expect(screen.getByText('クリア履歴はありません')).toBeInTheDocument();
  });

  // クリア履歴表示のテスト（履歴あり）
  it('クリア履歴がある場合は履歴リストが表示される', async () => {
    // クリア履歴のモックデータ
    const mockHistory = [
      {
        id: '1',
        imageName: 'test_image_1',
        clearTime: 120,
        clearDate: '2025-04-09T12:00:00.000Z',
      },
      {
        id: '2',
        imageName: 'test_image_2',
        clearTime: 180,
        clearDate: '2025-04-08T12:00:00.000Z',
      },
    ];

    // getClearHistoryのモックを更新
    (getClearHistory as jest.Mock).mockReturnValue(mockHistory);

    render(<HomePage />);

    // クリア履歴リストが表示されていることを確認
    const historyList = screen.getByTestId('clear-history-list');
    expect(historyList).toBeInTheDocument();

    // 履歴アイテムが表示されていることを確認
    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems.length).toBe(2);
    expect(historyItems[0].textContent).toContain('test_image_1');
    expect(historyItems[1].textContent).toContain('test_image_2');
  });

  // ゲーム開始時にクリア履歴が非表示になるテスト
  it('ゲームが開始されるとクリア履歴が非表示になる', () => {
    // useGameStateのモックを更新（ゲーム開始状態）
    (useGameState as jest.Mock).mockReturnValue({
      toggleHintMode: jest.fn(),
      gameStarted: true, // ゲーム開始状態
      imageSourceMode: 'upload',
      setImageSourceMode: jest.fn(),
      handleImageUpload: jest.fn(),
      handleDifficultyChange: jest.fn(),
      handleStartGame: jest.fn(),
      handlePieceMove: jest.fn(),
      handleResetGame: jest.fn(),
      handleEndGame: jest.fn(),
      handleEmptyPanelClick: jest.fn(),
      gameState: {
        imageUrl: 'test.jpg',
        originalImageSize: { width: 800, height: 600 },
        pieces: [],
        division: 4,
        elapsedTime: 0,
        completed: false,
        hintModeEnabled: false,
        emptyPosition: { row: 0, col: 0 },
        emptyPanelClicks: 0,
        setPieces: jest.fn(),
        setCompleted: jest.fn(),
      },
    });

    render(<HomePage />);

    // クリア履歴リストが表示されていないことを確認
    expect(screen.queryByTestId('clear-history-list')).not.toBeInTheDocument();
  });

  // ゲーム状態変更時にクリア履歴が更新されるテスト
  it('ゲーム状態が変わるとクリア履歴が更新される', async () => {
    // 初期レンダリング（ゲーム開始前）
    const { rerender } = render(<HomePage />);

    // getClearHistoryが呼ばれたことを確認
    expect(getClearHistory).toHaveBeenCalledTimes(1);

    // useGameStateのモックを更新（ゲーム開始状態）
    (useGameState as jest.Mock).mockReturnValue({
      toggleHintMode: jest.fn(),
      gameStarted: true,
      imageSourceMode: 'upload',
      setImageSourceMode: jest.fn(),
      handleImageUpload: jest.fn(),
      handleDifficultyChange: jest.fn(),
      handleStartGame: jest.fn(),
      handlePieceMove: jest.fn(),
      handleResetGame: jest.fn(),
      handleEndGame: jest.fn(),
      handleEmptyPanelClick: jest.fn(),
      gameState: {
        imageUrl: 'test.jpg',
        originalImageSize: { width: 800, height: 600 },
        pieces: [],
        division: 4,
        elapsedTime: 0,
        completed: false,
        hintModeEnabled: false,
        emptyPosition: { row: 0, col: 0 },
        emptyPanelClicks: 0,
        setPieces: jest.fn(),
        setCompleted: jest.fn(),
      },
    });

    // 再レンダリング（ゲーム開始後）
    rerender(<HomePage />);

    // useGameStateのモックを更新（ゲーム終了状態）
    (useGameState as jest.Mock).mockReturnValue({
      toggleHintMode: jest.fn(),
      gameStarted: false,
      imageSourceMode: 'upload',
      setImageSourceMode: jest.fn(),
      handleImageUpload: jest.fn(),
      handleDifficultyChange: jest.fn(),
      handleStartGame: jest.fn(),
      handlePieceMove: jest.fn(),
      handleResetGame: jest.fn(),
      handleEndGame: jest.fn(),
      handleEmptyPanelClick: jest.fn(),
      gameState: {
        imageUrl: null,
        originalImageSize: null,
        pieces: [],
        division: 4,
        elapsedTime: 0,
        completed: false,
        hintModeEnabled: false,
        emptyPosition: null,
        emptyPanelClicks: 0,
        setPieces: jest.fn(),
        setCompleted: jest.fn(),
      },
    });

    // クリア履歴のモックデータ（ゲーム終了後）
    const mockHistory = [
      {
        id: '1',
        imageName: 'test_image',
        clearTime: 120,
        clearDate: '2025-04-09T12:00:00.000Z',
      },
    ];

    // getClearHistoryのモックを更新
    (getClearHistory as jest.Mock).mockReturnValue(mockHistory);

    // 再レンダリング（ゲーム終了後）
    rerender(<HomePage />);

    // getClearHistoryが再度呼ばれたことを確認
    expect(getClearHistory).toHaveBeenCalledTimes(3);

    // クリア履歴リストが表示されていることを確認
    const historyList = screen.getByTestId('clear-history-list');
    expect(historyList).toBeInTheDocument();

    // 履歴アイテムが表示されていることを確認
    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems.length).toBe(1);
    expect(historyItems[0].textContent).toContain('test_image');
  });
});
