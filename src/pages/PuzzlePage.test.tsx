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
    default: ({
      onStart,
      onOpenCollection,
    }: {
      onStart: () => void;
      onOpenCollection: () => void;
    }) => (
      <div data-testid="title-screen">
        <button onClick={onStart}>入館する</button>
        <button onClick={onOpenCollection}>収蔵目録を見る</button>
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

/** テスト用の記録ストレージスタブ（収蔵目録の描画に必要な最小実装） */
const mockRecordStorage = {
  getAll: () => [],
  get: () => undefined,
  save: () => {},
  recordScore: () => ({ isBestScore: false }),
};

/** テスト用の累計クリア数ストレージスタブ */
const mockTotalClearsStorage = {
  get: () => 0,
  increment: () => 0,
};

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
    fireEvent.click(screen.getByText('入館する'));

    // 遊び方の説明が表示されていることを確認
    expect(screen.getByText('遊び方')).toBeInTheDocument();
    expect(screen.getByText(/デフォルト画像から選択して/)).toBeInTheDocument();
  });

  it('クリア履歴がない場合は「クリア履歴はありません」と表示される', () => {
    renderWithProvider(<PuzzlePage />);

    // タイトル画面を通過
    fireEvent.click(screen.getByText('入館する'));

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
    fireEvent.click(screen.getByText('入館する'));

    const historyItems = screen.getAllByTestId('history-item');
    expect(historyItems.length).toBe(2);
    expect(historyItems[0].textContent).toContain('test_image_1');
    expect(historyItems[1].textContent).toContain('test_image_2');
  });

  it('タイトルから収蔵目録を開き、戻れる', () => {
    renderWithProvider(
      <PuzzlePage recordStorage={mockRecordStorage} totalClearsStorage={mockTotalClearsStorage} />
    );

    fireEvent.click(screen.getByRole('button', { name: '収蔵目録を見る' }));
    expect(screen.getByText('収蔵目録')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(screen.getByRole('button', { name: '入館する' })).toBeInTheDocument();
  });
});
