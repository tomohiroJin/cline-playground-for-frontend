// useResponsiveSize フックのユニットテスト

import { renderHook, act } from '@testing-library/react';
import { useResponsiveSize } from '../hooks/use-responsive-size';
import { BREAKPOINTS } from '../constants';

describe('BREAKPOINTS', () => {
  it('ブレイクポイント定数が正しく定義されている', () => {
    expect(BREAKPOINTS.mobile).toBe(480);
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
  });
});

describe('useResponsiveSize', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  const setWindowSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  };

  afterEach(() => {
    setWindowSize(originalInnerWidth, originalInnerHeight);
  });

  describe('cellSize', () => {
    it('デスクトップでは画面サイズに応じてセルサイズが拡大する', () => {
      setWindowSize(1200, 800);
      const { result } = renderHook(() => useResponsiveSize());
      // widthBased = (1200 - 32) / 12 = 97.33 → 97
      // heightBased = (800 - 200) / 18 = 33.33 → 33
      // min(97, 33) = 33, clamped to max 50 → 33
      expect(result.current.cellSize).toBe(33);
    });

    it('大画面デスクトップではセルサイズが上限50pxまで拡大する', () => {
      setWindowSize(1920, 1200);
      const { result } = renderHook(() => useResponsiveSize());
      // widthBased = (1920 - 32) / 12 = 157.33 → 157
      // heightBased = (1200 - 200) / 18 = 55.55 → 55
      // min(157, 55) = 55, clamped to max 50 → 50
      expect(result.current.cellSize).toBe(50);
    });

    it('デスクトップでも最低30pxは保証される', () => {
      setWindowSize(1100, 700);
      const { result } = renderHook(() => useResponsiveSize());
      // widthBased = (1100 - 32) / 12 = 89 → 89
      // heightBased = (700 - 200) / 18 = 27.77 → 27
      // min(89, 27) = 27, clamped to min 30 → 30
      expect(result.current.cellSize).toBe(30);
    });

    it('モバイル幅ではセルサイズの下限30pxが適用される', () => {
      // 幅が狭い場合：計算値28だが下限30が適用
      setWindowSize(375, 900);
      const { result } = renderHook(() => useResponsiveSize());
      // widthBased = (375 - 32) / 12 = 28.58 → 28
      // heightBased = (900 - 200) / 18 = 38.88 → 38
      // min(28, 38) = 28, clamped to min 30 → 30
      expect(result.current.cellSize).toBe(30);
    });

    it('画面高さが非常に低い場合でも下限30pxが適用される', () => {
      setWindowSize(480, 500);
      const { result } = renderHook(() => useResponsiveSize());
      // widthBased = (480 - 32) / 12 = 37.33 → 37
      // heightBased = (500 - 200) / 18 = 16.66 → 16
      // min(37, 16) = 16, clamped to min 30 → 30
      expect(result.current.cellSize).toBe(30);
    });

    it('タブレットでは画面に合わせてセルサイズが30pxを超えて拡大する', () => {
      // iPad (768x1024) — 上限なし、画面に収まる最大サイズ
      setWindowSize(768, 1024);
      const { result } = renderHook(() => useResponsiveSize());
      // widthBased = (768 - 32) / 12 = 61.33 → 61
      // heightBased = (1024 - 200) / 18 = 45.77 → 45
      // min(61, 45) = 45
      expect(result.current.cellSize).toBe(45);
    });

    it('大きめモバイルでは画面に合わせてセルサイズが拡大する', () => {
      // 大画面スマホ (430x932)
      setWindowSize(430, 932);
      const { result } = renderHook(() => useResponsiveSize());
      // widthBased = (430 - 32) / 12 = 33.16 → 33
      // heightBased = (932 - 200) / 18 = 40.66 → 40
      // min(33, 40) = 33
      expect(result.current.cellSize).toBe(33);
    });

    it('横向きで画面高さが低い場合でも下限30pxが保証される', () => {
      setWindowSize(600, 400);
      const { result } = renderHook(() => useResponsiveSize());
      // isLandscape = true (600 > 400 && 600 <= 1024)
      // (400 - 80) / 18 = 17.77 → 17, clamped to min 30 → 30
      expect(result.current.cellSize).toBe(30);
    });

    it('リサイズイベントでセルサイズが再計算される', () => {
      setWindowSize(1200, 800);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.cellSize).toBe(33);

      act(() => {
        setWindowSize(375, 900);
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current.cellSize).toBe(30);
    });
  });

  describe('isLandscape', () => {
    it('横向きの場合trueを返す', () => {
      setWindowSize(896, 414);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.isLandscape).toBe(true);
    });

    it('縦向きの場合falseを返す', () => {
      setWindowSize(375, 667);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.isLandscape).toBe(false);
    });
  });

  describe('isMobile', () => {
    it('480px以下でtrueを返す', () => {
      setWindowSize(375, 667);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.isMobile).toBe(true);
    });

    it('481px以上でfalseを返す', () => {
      setWindowSize(768, 1024);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.isMobile).toBe(false);
    });
  });

  describe('controllerPosition', () => {
    it('モバイル横向きではsideを返す', () => {
      setWindowSize(896, 414);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.controllerPosition).toBe('side');
    });

    it('モバイル縦向きではbottomを返す', () => {
      setWindowSize(375, 667);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.controllerPosition).toBe('bottom');
    });

    it('デスクトップではbottomを返す', () => {
      setWindowSize(1200, 800);
      const { result } = renderHook(() => useResponsiveSize());
      expect(result.current.controllerPosition).toBe('bottom');
    });
  });

  describe('横向き時のセルサイズ計算', () => {
    it('横向きでは画面高さベースで計算し下限30pxが適用される', () => {
      setWindowSize(896, 414);
      const { result } = renderHook(() => useResponsiveSize());
      // (414 - 80) / 18 = 18.55 → 18, clamped to min 30 → 30
      expect(result.current.cellSize).toBe(30);
    });

    it('横向きで高さが十分な場合は30pxを超えて拡大する', () => {
      // タブレット横向き (1024x768)
      setWindowSize(1024, 768);
      const { result } = renderHook(() => useResponsiveSize());
      // isLandscape = true (1024 > 768 && 1024 <= 1024)
      // (768 - 80) / 18 = 38.22 → 38
      expect(result.current.cellSize).toBe(38);
    });
  });
});
