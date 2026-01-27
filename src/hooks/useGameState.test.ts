import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { Provider } from 'jotai';

describe('useGameState', () => {
  test('初期状態が正しいこと', () => {
    const { result } = renderHook(() => useGameState(), { wrapper: Provider });

    expect(result.current.gameStarted).toBe(false);
    expect(result.current.imageSourceMode).toBe('upload');
    expect(result.current.gameState.hintModeEnabled).toBe(false);
    expect(result.current.gameState.division).toBe(4); // Default division
  });

  test('画像アップロードが正しく動作すること', () => {
    const { result } = renderHook(() => useGameState(), { wrapper: Provider });
    const dummyUrl = 'blob:dummy';
    const width = 800;
    const height = 600;

    act(() => {
      result.current.handleImageUpload(dummyUrl, width, height);
    });

    expect(result.current.gameState.imageUrl).toBe(dummyUrl);
    expect(result.current.gameState.originalImageSize).toEqual({ width, height });
  });

  test('難易度変更が正しく動作すること', () => {
    const { result } = renderHook(() => useGameState(), { wrapper: Provider });

    act(() => {
      result.current.handleDifficultyChange(4);
    });

    expect(result.current.gameState.division).toBe(4);
  });

  test('ゲーム開始が正しく動作すること', () => {
    const { result } = renderHook(() => useGameState(), { wrapper: Provider });

    // 画像を設定しておく
    act(() => {
      result.current.handleImageUpload('blob:dummy', 800, 600);
    });

    act(() => {
      result.current.handleStartGame();
    });

    expect(result.current.gameStarted).toBe(true);
    // パズルが初期化されている（ピースが生成されている）こと確認
    expect(result.current.gameState.pieces.length).toBeGreaterThan(0);
  });

  test('ゲーム終了・リセットが正しく動作すること', () => {
    const { result } = renderHook(() => useGameState(), { wrapper: Provider });

    // 画像セット & 開始
    act(() => {
      result.current.handleImageUpload('blob:dummy', 800, 600);
      result.current.handleStartGame();
    });

    expect(result.current.gameStarted).toBe(true);

    // 終了
    act(() => {
      result.current.handleEndGame();
    });
    expect(result.current.gameStarted).toBe(false);

    // リセット（内部でinitializePuzzle呼ばれる）
    // リセット動作を確認するために、再度開始してからリセット
    act(() => {
      result.current.handleStartGame();
    });
    // 開始直後のstartTime
    // const startTime1 = result.current.gameState.elapsedTime;

    act(() => {
      result.current.handleResetGame();
    });
    // Reset calls initializePuzzle, which resets elapsedTime to 0
    expect(result.current.gameState.elapsedTime).toBe(0);
  });

  test('空パネルクリックのカウントテスト', () => {
    const { result } = renderHook(() => useGameState(), { wrapper: Provider });

    expect(result.current.gameState.emptyPanelClicks).toBe(0);

    act(() => {
      result.current.handleEmptyPanelClick();
    });

    expect(result.current.gameState.emptyPanelClicks).toBe(1);
  });

  test('ヒントモードの切り替えが正しく動作すること', () => {
    const { result } = renderHook(() => useGameState(), { wrapper: Provider });

    expect(result.current.gameState.hintModeEnabled).toBe(false);

    act(() => {
      result.current.toggleHintMode();
    });

    expect(result.current.gameState.hintModeEnabled).toBe(true);

    act(() => {
      result.current.toggleHintMode();
    });

    expect(result.current.gameState.hintModeEnabled).toBe(false);
  });
});
