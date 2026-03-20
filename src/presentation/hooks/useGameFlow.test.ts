import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { Provider } from 'jotai';
import { useGameFlow, UseGameFlowOptions } from './useGameFlow';
import { MockPuzzleRecordStorage, MockTotalClearsStorage } from '../../test-helpers/mock-storage';

/** Jotai Provider でラップするヘルパー */
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.createElement(Provider, null, children);

/** テスト用のデフォルトオプション */
const createOptions = (): UseGameFlowOptions => ({
  recordStorage: new MockPuzzleRecordStorage(),
  totalClearsStorage: new MockTotalClearsStorage(),
});

describe('useGameFlow', () => {
  describe('handleImageSelect', () => {
    it('画像URL とサイズを設定する', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      act(() => {
        result.current.handleImageSelect('http://example.com/img.jpg', 800, 600);
      });

      expect(result.current.imageUrl).toBe('http://example.com/img.jpg');
      expect(result.current.imageSize).toEqual({ width: 800, height: 600 });
    });
  });

  describe('handleStartGame', () => {
    it('ゲーム開始でフェーズが playing に変わる', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      act(() => {
        result.current.handleStartGame();
      });

      expect(result.current.gamePhase).toBe('playing');
    });

    it('ゲーム開始でパズルが初期化される', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      // 分割数を事前設定
      act(() => {
        result.current.handleDifficultyChange(3);
      });

      act(() => {
        result.current.handleStartGame();
      });

      expect(result.current.boardState).not.toBeNull();
      expect(result.current.boardState?.pieces).toHaveLength(9);
    });

    it('ゲーム開始でパズルが未完成状態になる', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      // 3×3 を使用（2×2 はシャッフル後に完成状態に戻る確率がある）
      act(() => {
        result.current.handleDifficultyChange(3);
      });

      act(() => {
        result.current.handleStartGame();
      });

      expect(result.current.boardState?.isCompleted).toBe(false);
    });
  });

  describe('handlePieceMove', () => {
    it('ピース移動が呼び出せる', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      act(() => {
        result.current.handleStartGame();
      });

      act(() => {
        result.current.handlePieceMove(0);
      });

      expect(result.current.boardState).not.toBeNull();
    });
  });

  describe('handleResetGame', () => {
    it('リセットでパズルが再初期化される', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      // 3×3 を使用
      act(() => {
        result.current.handleDifficultyChange(3);
      });

      act(() => {
        result.current.handleStartGame();
      });

      act(() => {
        result.current.handleResetGame();
      });

      expect(result.current.boardState?.moveCount).toBe(0);
      expect(result.current.boardState?.pieces).toHaveLength(9);
    });
  });

  describe('handleEndGame', () => {
    it('ゲーム終了でフェーズが setup に変わる', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      act(() => {
        result.current.handleStartGame();
      });

      expect(result.current.gamePhase).toBe('playing');

      act(() => {
        result.current.handleEndGame();
      });

      expect(result.current.gamePhase).toBe('setup');
    });
  });

  describe('handleEmptyPanelClick', () => {
    it('空パネルクリックでカウントが増える', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      act(() => {
        result.current.handleStartGame();
      });

      act(() => {
        result.current.handleEmptyPanelClick();
      });

      expect(result.current.emptyPanelClicks).toBe(1);
    });
  });

  describe('completeForDebug', () => {
    it('デバッグ完成でボードが完成状態になる', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      act(() => {
        result.current.handleStartGame();
      });

      act(() => {
        result.current.completeForDebug();
      });

      expect(result.current.boardState?.isCompleted).toBe(true);
    });
  });

  describe('DI パターン', () => {
    it('注入されたストレージがパズル完成時に使用される', () => {
      const recordStorage = new MockPuzzleRecordStorage();
      const totalClearsStorage = new MockTotalClearsStorage();

      const { result } = renderHook(
        () => useGameFlow({ recordStorage, totalClearsStorage }),
        { wrapper }
      );

      act(() => {
        result.current.handleImageSelect('http://example.com/test.jpg', 100, 100);
      });

      act(() => {
        result.current.handleStartGame();
      });

      act(() => {
        result.current.completeForDebug();
      });

      expect(totalClearsStorage.get()).toBe(1);
      expect(recordStorage.getAll().length).toBe(1);
    });
  });

  describe('handleDifficultyChange', () => {
    it('分割数を変更できる', () => {
      const { result } = renderHook(() => useGameFlow(createOptions()), { wrapper });

      act(() => {
        result.current.handleDifficultyChange(5);
      });

      expect(result.current.division).toBe(5);
    });
  });
});
