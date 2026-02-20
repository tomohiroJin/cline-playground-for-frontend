import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzlePage from './PuzzlePage';
import { useGameState } from '../hooks/useGameState';
import { getClearHistory } from '../utils/storage-utils';

// モックの設定
jest.mock('../hooks/useGameState');
jest.mock('../utils/storage-utils');
jest.mock('../components/PuzzleSections', () => ({
  SetupSectionComponent: () => <div data-testid="setup-section">Setup Section</div>,
  GameSectionComponent: () => <div data-testid="game-section">Game Section</div>,
}));
jest.mock('../components/molecules/ClearHistoryList', () => {
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe('PuzzlePage', () => {
  // モックの初期化
  beforeEach(() => {
    // useGameStateのモック
    (useGameState as jest.Mock).mockReturnValue({
      toggleHintMode: jest.fn(),
      gameStarted: false,
      handleImageSelect: jest.fn(),
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
    render(<PuzzlePage />);

    // 遊び方の説明が表示されていることを確認
    expect(screen.getByText('遊び方')).toBeInTheDocument();
    expect(screen.getByText(/デフォルト画像から選択して/)).toBeInTheDocument();
  });

  // クリア履歴表示のテスト（履歴なし）
  it('クリア履歴がない場合は「クリア履歴はありません」と表示される', async () => {
    render(<PuzzlePage />);

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

    render(<PuzzlePage />);

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
      handleImageSelect: jest.fn(),
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

    render(<PuzzlePage />);

    // クリア履歴リストが表示されていないことを確認
    expect(screen.queryByTestId('clear-history-list')).not.toBeInTheDocument();
  });

  // ゲーム状態変更時にクリア履歴が更新されるテスト
  it('ゲーム状態が変わるとクリア履歴が更新される', async () => {
    // 初期レンダリング（ゲーム開始前）
    const { rerender } = render(<PuzzlePage />);

    // getClearHistoryが呼ばれたことを確認
    expect(getClearHistory).toHaveBeenCalledTimes(1);

    // useGameStateのモックを更新（ゲーム開始状態）
    (useGameState as jest.Mock).mockReturnValue({
      toggleHintMode: jest.fn(),
      gameStarted: true,
      handleImageSelect: jest.fn(),
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
    rerender(<PuzzlePage />);

    // useGameStateのモックを更新（ゲーム終了状態）
    (useGameState as jest.Mock).mockReturnValue({
      toggleHintMode: jest.fn(),
      gameStarted: false,
      handleImageSelect: jest.fn(),
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
    rerender(<PuzzlePage />);

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
