import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'jotai';
import PuzzlePage from './PuzzlePage';
import { getClearHistory } from '../utils/storage-utils';

// モックの設定
jest.mock('../utils/storage-utils');
jest.mock('../infrastructure/storage/puzzle-records-store');
jest.mock('../infrastructure/storage/total-clears-store');
jest.mock('../components/TitleScreen', () => {
  return {
    __esModule: true,
    default: ({ onStart }: { onStart: () => void }) => (
      <div data-testid="title-screen">
        <button onClick={onStart}>はじめる</button>
      </div>
    ),
  };
});
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

/** Jotai Provider でラップしてレンダリングする */
const renderWithProvider = (ui: React.ReactElement) =>
  render(React.createElement(Provider, null, ui));

describe('PuzzlePage', () => {
  beforeEach(() => {
    (getClearHistory as jest.Mock).mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('初回レンダリングでタイトル画面が表示される', () => {
    renderWithProvider(<PuzzlePage />);

    expect(screen.getByTestId('title-screen')).toBeInTheDocument();
    expect(screen.queryByText('遊び方')).not.toBeInTheDocument();
    expect(screen.queryByTestId('setup-section')).not.toBeInTheDocument();
  });

  it('基本的なコンポーネントがレンダリングされる', () => {
    renderWithProvider(<PuzzlePage />);

    // タイトル画面を通過
    fireEvent.click(screen.getByText('はじめる'));

    // 遊び方の説明が表示されていることを確認
    expect(screen.getByText('遊び方')).toBeInTheDocument();
    expect(screen.getByText(/デフォルト画像から選択して/)).toBeInTheDocument();
  });

  it('クリア履歴がない場合は「クリア履歴はありません」と表示される', () => {
    renderWithProvider(<PuzzlePage />);

    // タイトル画面を通過
    fireEvent.click(screen.getByText('はじめる'));

    // クリア履歴リストが表示されていることを確認
    const historyList = screen.getByTestId('clear-history-list');
    expect(historyList).toBeInTheDocument();
    expect(screen.getByText('クリア履歴はありません')).toBeInTheDocument();
  });

  it('クリア履歴がある場合は履歴リストが表示される', () => {
    const mockHistory = [
      { id: '1', imageName: 'test_image_1', clearTime: 120, clearDate: '2025-04-09T12:00:00.000Z' },
      { id: '2', imageName: 'test_image_2', clearTime: 180, clearDate: '2025-04-08T12:00:00.000Z' },
    ];
    (getClearHistory as jest.Mock).mockReturnValue(mockHistory);

    renderWithProvider(<PuzzlePage />);

    // タイトル画面を通過
    fireEvent.click(screen.getByText('はじめる'));

    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems.length).toBe(2);
    expect(historyItems[0].textContent).toContain('test_image_1');
    expect(historyItems[1].textContent).toContain('test_image_2');
  });
});
