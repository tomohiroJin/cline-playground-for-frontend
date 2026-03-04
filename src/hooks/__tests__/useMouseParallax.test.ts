import { renderHook, act } from '@testing-library/react';
import { useMouseParallax } from '../useMouseParallax';

describe('useMouseParallax', () => {
  beforeEach(() => {
    // ビューポートサイズを設定（jsdom デフォルトは 0）
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });

    // タッチデバイスでないことを保証
    if ('ontouchstart' in window) {
      delete (window as unknown as Record<string, unknown>).ontouchstart;
    }
  });

  describe('正常系', () => {
    it('初期値が { x: 0, y: 0 } であること', () => {
      const { result } = renderHook(() => useMouseParallax());
      expect(result.current).toEqual({ x: 0, y: 0 });
    });

    it('マウスイベントで値が更新されること', () => {
      const { result } = renderHook(() => useMouseParallax());

      act(() => {
        // ビューポート中心 (500, 400) からの相対位置を計算
        // clientX=750 → (750 - 500) / 500 = 0.5
        // clientY=600 → (600 - 400) / 400 = 0.5
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 750,
          clientY: 600,
        }));
      });

      expect(result.current.x).toBeCloseTo(0.5);
      expect(result.current.y).toBeCloseTo(0.5);
    });

    it('ビューポート左上隅でマウス位置が -1.0 に近い値になること', () => {
      const { result } = renderHook(() => useMouseParallax());

      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 0,
          clientY: 0,
        }));
      });

      expect(result.current.x).toBeCloseTo(-1.0);
      expect(result.current.y).toBeCloseTo(-1.0);
    });

    it('ビューポート右下隅でマウス位置が +1.0 に近い値になること', () => {
      const { result } = renderHook(() => useMouseParallax());

      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 1000,
          clientY: 800,
        }));
      });

      expect(result.current.x).toBeCloseTo(1.0);
      expect(result.current.y).toBeCloseTo(1.0);
    });
  });

  describe('タッチデバイス', () => {
    it('タッチデバイスでは常に { x: 0, y: 0 } を返すこと', () => {
      // タッチデバイスをシミュレート
      Object.defineProperty(window, 'ontouchstart', {
        value: null,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useMouseParallax());

      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 750,
          clientY: 600,
        }));
      });

      expect(result.current).toEqual({ x: 0, y: 0 });
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にイベントリスナーが解除されること', () => {
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useMouseParallax());

      // mousemove リスナーが登録されたことを確認
      expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));

      unmount();

      // mousemove リスナーが解除されたことを確認
      expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
