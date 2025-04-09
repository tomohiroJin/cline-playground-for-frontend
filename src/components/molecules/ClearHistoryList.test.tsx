import React from 'react';
import { render, screen } from '@testing-library/react';
import ClearHistoryList from './ClearHistoryList';
import { ClearHistory } from '../../utils/storage-utils';

// formatElapsedTimeをモック
jest.mock('../../utils/puzzle-utils', () => ({
  formatElapsedTime: (seconds: number) => `${Math.floor(seconds / 60)}:${seconds % 60}`,
}));

describe('ClearHistoryList', () => {
  it('履歴が空の場合は「クリア履歴はありません」と表示される', () => {
    render(<ClearHistoryList history={[]} />);

    expect(screen.getByText('クリア履歴はありません')).toBeInTheDocument();
  });

  it('履歴がある場合は履歴リストが表示される', () => {
    const mockHistory: ClearHistory[] = [
      {
        id: '1',
        imageName: 'test_image_1',
        clearTime: 120, // 2分
        clearDate: '2025-04-09T12:00:00.000Z',
      },
      {
        id: '2',
        imageName: 'test_image_2',
        clearTime: 180, // 3分
        clearDate: '2025-04-08T12:00:00.000Z',
      },
    ];

    render(<ClearHistoryList history={mockHistory} />);

    // タイトルが表示されていることを確認
    expect(screen.getByText('クリア履歴')).toBeInTheDocument();

    // 各履歴の要素が表示されていることを確認
    expect(screen.getByText('test_image_1')).toBeInTheDocument();
    expect(screen.getByText('test_image_2')).toBeInTheDocument();

    // クリアタイムが表示されていることを確認（モックされたformatElapsedTimeの結果）
    expect(screen.getByText('クリアタイム: 2:0')).toBeInTheDocument();
    expect(screen.getByText('クリアタイム: 3:0')).toBeInTheDocument();

    // 日付が表示されていることを確認
    // 注: toLocaleDateStringはテスト環境によって結果が異なるため、完全一致ではなく部分一致で確認
    const dateElements = screen.getAllByText(/\d{4}\/\d{2}\/\d{2}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('日付が正しくフォーマットされる', () => {
    // Date.toLocaleDateStringをモック
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    Date.prototype.toLocaleDateString = jest.fn(() => '2025/04/09 12:00');

    const mockHistory: ClearHistory[] = [
      {
        id: '1',
        imageName: 'test_image',
        clearTime: 120,
        clearDate: '2025-04-09T12:00:00.000Z',
      },
    ];

    render(<ClearHistoryList history={mockHistory} />);

    expect(screen.getByText('2025/04/09 12:00')).toBeInTheDocument();

    // モックを元に戻す
    Date.prototype.toLocaleDateString = originalToLocaleDateString;
  });
});
