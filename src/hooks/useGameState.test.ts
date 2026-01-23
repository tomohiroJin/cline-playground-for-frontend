import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useGameState } from './useGameState';

jest.mock('./usePuzzle', () => ({
  usePuzzle: () => ({
    imageUrl: '',
    setImageUrl: jest.fn(),
    originalImageSize: { width: 0, height: 0 },
    setOriginalImageSize: jest.fn(),
    division: 3,
    setDivision: jest.fn(),
    pieces: [],
    setPieces: jest.fn(),
    emptyPosition: 0,
    elapsedTime: 0,
    completed: false,
    setCompleted: jest.fn(),
    initializePuzzle: jest.fn(),
    movePiece: jest.fn(),
    resetPuzzle: jest.fn(),
  }),
}));

jest.mock('./useHintMode', () => ({
  useHintMode: () => ({
    hintModeEnabled: false,
    toggleHintMode: jest.fn(),
  }),
}));

describe('useGameState', () => {
  it('初期状態ではゲームが開始されておらず、画像ソースモードがアップロードで、空のパネルクリック数が0である', () => {
    const { result } = renderHook(() => useGameState());

    expect(result.current.gameStarted).toBe(false);
    expect(result.current.imageSourceMode).toBe('upload');
    expect(result.current.gameState.emptyPanelClicks).toBe(0);
  });

  it('画像をアップロードすると、指定されたURLと画像サイズが設定される', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.handleImageUpload('test-url', 100, 200);
    });

    expect(result.current.gameState.imageUrl).toBe('');
    expect(result.current.gameState.originalImageSize).toEqual({ width: 0, height: 0 });
  });

  it('ゲームを開始すると、ゲームが開始状態になる', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.handleStartGame();
    });

    expect(result.current.gameStarted).toBe(true);
  });

  it('空のパネルをクリックすると、クリック数が1増加する', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.handleEmptyPanelClick();
    });

    expect(result.current.gameState.emptyPanelClicks).toBe(1);
  });

  it('画像ソースモードを変更すると、指定されたモードに切り替わる', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.setImageSourceMode('default');
    });

    expect(result.current.imageSourceMode).toBe('default');
  });

  it('ゲームを終了すると、ゲームが未開始状態になる', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.handleStartGame();
      result.current.handleEndGame();
    });

    expect(result.current.gameStarted).toBe(false);
  });
});
