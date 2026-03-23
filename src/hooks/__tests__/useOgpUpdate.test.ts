import { renderHook } from '@testing-library/react';
import { useOgpUpdate } from '../useOgpUpdate';

// react-router-dom のモック
const mockPathname = { pathname: '/' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockPathname,
}));

describe('useOgpUpdate', () => {
  /** OGP メタタグの値を取得するヘルパー */
  const getOgMeta = (property: string): string | null => {
    const meta = document.querySelector(`meta[property="${property}"]`);
    return meta?.getAttribute('content') ?? null;
  };

  /** 元のOGP値 */
  const originalOgTitle = 'Game Platform';
  const originalOgDescription = '13種類の無料ブラウザゲームが楽しめるゲームプラットフォーム';
  const originalOgUrl = 'https://play.niku9.click/';

  /** テスト用OGPメタタグを初期化 */
  const ensureOgMeta = (property: string, content: string): void => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  beforeEach(() => {
    mockPathname.pathname = '/';
    ensureOgMeta('og:title', originalOgTitle);
    ensureOgMeta('og:description', originalOgDescription);
    ensureOgMeta('og:url', originalOgUrl);
  });

  describe('ゲームページでの OGP 更新', () => {
    it('ゲームページで og:title が更新されること', () => {
      mockPathname.pathname = '/puzzle';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:title')).toBe('Picture Puzzle - Game Platform');
    });

    it('ゲームページで og:description が更新されること', () => {
      mockPathname.pathname = '/puzzle';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:description')).toContain('スライドパズル');
    });

    it('ゲームページで og:url が更新されること', () => {
      mockPathname.pathname = '/puzzle';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:url')).toBe('https://play.niku9.click/puzzle');
    });
  });

  describe('情報ページでの OGP 更新', () => {
    it('About ページで og:title が更新されること', () => {
      mockPathname.pathname = '/about';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:title')).toBe('サイトについて - Game Platform');
    });

    it('About ページで og:description が更新されること', () => {
      mockPathname.pathname = '/about';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:description')).toContain('サイト概要');
    });

    it('About ページで og:url が更新されること', () => {
      mockPathname.pathname = '/about';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:url')).toBe('https://play.niku9.click/about');
    });

    it('Contact ページで og:title が更新されること', () => {
      mockPathname.pathname = '/contact';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:title')).toBe('お問い合わせ - Game Platform');
    });
  });

  describe('ホームページでの OGP', () => {
    it('ホームページでは元の OGP が維持されること', () => {
      mockPathname.pathname = '/';
      renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:title')).toBe(originalOgTitle);
      expect(getOgMeta('og:description')).toBe(originalOgDescription);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時に元の OGP 値に戻ること', () => {
      mockPathname.pathname = '/puzzle';
      const { unmount } = renderHook(() => useOgpUpdate());

      expect(getOgMeta('og:title')).toBe('Picture Puzzle - Game Platform');

      unmount();

      expect(getOgMeta('og:title')).toBe(originalOgTitle);
      expect(getOgMeta('og:description')).toBe(originalOgDescription);
      expect(getOgMeta('og:url')).toBe(originalOgUrl);
    });
  });
});
