// テストモードフックのユニットテスト

import { renderHook, act } from '@testing-library/react';
import { useTestMode } from '../hooks/use-test-mode';
import type { GameStatus } from '../types';

describe('useTestMode', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('初期状態', () => {
    it('初期状態ではテストモードが無効', () => {
      const { result } = renderHook(() => useTestMode('idle'));
      expect(result.current.isTestMode).toBe(false);
    });
  });

  describe('隠しコマンド検知', () => {
    it('idle状態で「jinjinjin」をタイプするとテストモードが有効になる', () => {
      const { result } = renderHook(() => useTestMode('idle'));

      act(() => {
        // 「jinjinjin」を1文字ずつ入力
        'jinjinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });

      expect(result.current.isTestMode).toBe(true);
    });

    it('idle状態以外ではコマンドが無視される', () => {
      const { result } = renderHook(() => useTestMode('playing'));

      act(() => {
        'jinjinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });

      expect(result.current.isTestMode).toBe(false);
    });

    it('不完全な入力ではテストモードが有効にならない', () => {
      const { result } = renderHook(() => useTestMode('idle'));

      act(() => {
        'jinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });

      expect(result.current.isTestMode).toBe(false);
    });

    it('関係ないキーが混ざるとバッファがリセットされない（末尾9文字で判定）', () => {
      const { result } = renderHook(() => useTestMode('idle'));

      act(() => {
        // 余計な文字の後に正しい入力
        'xyzjinjinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });

      expect(result.current.isTestMode).toBe(true);
    });
  });

  describe('トグル動作', () => {
    it('テストモード有効中に再度「jinjinjin」でテストモードが無効になる', () => {
      const { result } = renderHook(() => useTestMode('idle'));

      // 有効化
      act(() => {
        'jinjinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });
      expect(result.current.isTestMode).toBe(true);

      // 無効化
      act(() => {
        'jinjinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });
      expect(result.current.isTestMode).toBe(false);
    });
  });

  describe('ステータス変化対応', () => {
    it('idle状態に戻ったときもコマンド入力を受け付ける', () => {
      const { result, rerender } = renderHook(
        ({ status }: { status: GameStatus }) => useTestMode(status),
        { initialProps: { status: 'playing' as GameStatus } }
      );

      // playing中はコマンド無視
      act(() => {
        'jinjinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });
      expect(result.current.isTestMode).toBe(false);

      // idle に戻ってからコマンド入力
      rerender({ status: 'idle' as GameStatus });
      act(() => {
        'jinjinjin'.split('').forEach(key => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        });
      });
      expect(result.current.isTestMode).toBe(true);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にイベントリスナーが削除される', () => {
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useTestMode('idle'));

      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
