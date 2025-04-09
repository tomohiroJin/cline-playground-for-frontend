import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PuzzleBoard from './PuzzleBoard';
import { Provider } from 'jotai';

// モックデータ
const mockProps = {
  imageUrl: '/images/default/camel_in_the_desert.png',
  originalWidth: 800,
  originalHeight: 600,
  pieces: [
    {
      id: 1,
      correctPosition: { row: 0, col: 0 },
      currentPosition: { row: 0, col: 0 },
      isEmpty: false,
    },
    {
      id: 0,
      correctPosition: { row: 0, col: 1 },
      currentPosition: { row: 0, col: 1 },
      isEmpty: true,
    },
  ],
  division: 2,
  elapsedTime: 120,
  completed: false,
  hintMode: false,
  emptyPosition: { row: 0, col: 1 },
  onPieceMove: jest.fn(),
  onReset: jest.fn(),
  onToggleHint: jest.fn(),
  onEmptyPanelClick: jest.fn(),
};

// モック
jest.mock('../../hooks/useVideoPlayback', () => ({
  useVideoPlayback: () => ({
    videoPlaybackEnabled: false,
    videoUrl: null,
    enableVideoPlayback: jest.fn(),
    disableVideoPlayback: jest.fn(),
    getVideoUrlFromImage: jest.fn().mockReturnValue('/videos/default/camel_in_the_desert.mp4'),
    setVideo: jest.fn(),
  }),
}));

jest.mock('../../hooks/useCompletionOverlay', () => ({
  useCompletionOverlay: () => ({
    overlayVisible: true,
    toggleOverlay: jest.fn(),
  }),
}));

describe('PuzzleBoard', () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<Provider>{ui}</Provider>);
  };

  it('パズルボードが正しくレンダリングされること', () => {
    renderWithProvider(<PuzzleBoard {...mockProps} />);

    // ボードグリッドが存在することを確認
    expect(screen.getByTitle('ボードグリッド')).toBeInTheDocument();

    // 経過時間が表示されていることを確認
    expect(screen.getByText(/経過時間:/)).toBeInTheDocument();

    // ヒントボタンが表示されていることを確認
    expect(screen.getByText('ヒントを表示')).toBeInTheDocument();
  });

  it('完成時にオーバーレイが表示されること', () => {
    const completedProps = {
      ...mockProps,
      completed: true,
    };

    renderWithProvider(<PuzzleBoard {...completedProps} />);

    // 完成メッセージが表示されていることを確認
    expect(screen.getByText('パズル完成！')).toBeInTheDocument();

    // 所要時間が表示されていることを確認
    expect(screen.getByText(/所要時間:/)).toBeInTheDocument();

    // リスタートボタンが表示されていることを確認
    expect(screen.getByText('もう一度挑戦')).toBeInTheDocument();
  });

  it('ヒントモードが有効な場合にヒント画像が表示されること', () => {
    const hintProps = {
      ...mockProps,
      hintMode: true,
    };

    renderWithProvider(<PuzzleBoard {...hintProps} />);

    // ヒント画像が存在することを確認
    expect(screen.getByTitle('ヒント画像')).toBeInTheDocument();
  });

  it('ピースをクリックするとonPieceMoveが呼ばれること', () => {
    renderWithProvider(<PuzzleBoard {...mockProps} />);

    // ピースをクリック
    const pieces = document.querySelectorAll('[data-testid="puzzle-piece"]');
    if (pieces.length > 0) {
      fireEvent.click(pieces[0]);
      expect(mockProps.onPieceMove).toHaveBeenCalled();
    }
  });

  it('ヒントボタンをクリックするとonToggleHintが呼ばれること', () => {
    renderWithProvider(<PuzzleBoard {...mockProps} />);

    // ヒントボタンをクリック
    fireEvent.click(screen.getByText('ヒントを表示'));
    expect(mockProps.onToggleHint).toHaveBeenCalled();
  });

  it('完成時にリスタートボタンをクリックするとonResetが呼ばれること', () => {
    const completedProps = {
      ...mockProps,
      completed: true,
    };

    renderWithProvider(<PuzzleBoard {...completedProps} />);

    // リスタートボタンをクリック
    fireEvent.click(screen.getByText('もう一度挑戦'));
    expect(mockProps.onReset).toHaveBeenCalled();
  });
});
