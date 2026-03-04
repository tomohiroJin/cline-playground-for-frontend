import { renderHook } from '@testing-library/react';
import { useMetaDescription } from '../useMetaDescription';

// react-router-dom のモック
const mockPathname = { pathname: '/' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockPathname,
}));

describe('useMetaDescription', () => {
  /** テスト前の元の description */
  const originalDescription =
    '13種類の無料ブラウザゲームが楽しめるゲームプラットフォーム。パズル、シューティング、RPG、レース、ホラーなど多彩なジャンルを収録。';

  /** meta description 要素を取得 */
  const getMetaDescription = (): string | null => {
    const meta = document.querySelector('meta[name="description"]');
    return meta?.getAttribute('content') ?? null;
  };

  beforeEach(() => {
    // meta description を初期状態にリセット
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', originalDescription);
    mockPathname.pathname = '/';
  });

  describe('ルートに応じた description 設定', () => {
    it('ホームページの description が設定されること', () => {
      mockPathname.pathname = '/';
      renderHook(() => useMetaDescription());

      expect(getMetaDescription()).toBe(originalDescription);
    });

    it('ゲームページの description が動的に設定されること', () => {
      mockPathname.pathname = '/puzzle';
      renderHook(() => useMetaDescription());

      expect(getMetaDescription()).toContain('スライドパズル');
    });

    it('迷宮の残響ページの description が設定されること', () => {
      mockPathname.pathname = '/labyrinth-echo';
      renderHook(() => useMetaDescription());

      expect(getMetaDescription()).toContain('ローグライトRPG');
    });

    it('原始進化録ページの description が設定されること', () => {
      mockPathname.pathname = '/primal-path';
      renderHook(() => useMetaDescription());

      expect(getMetaDescription()).toContain('自動戦闘ローグライト');
    });

    it('About ページの description が設定されること', () => {
      mockPathname.pathname = '/about';
      renderHook(() => useMetaDescription());

      expect(getMetaDescription()).toContain('サイト概要');
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時に元の description に戻ること', () => {
      mockPathname.pathname = '/puzzle';
      const { unmount } = renderHook(() => useMetaDescription());

      // ゲームページの description が設定されている
      expect(getMetaDescription()).toContain('スライドパズル');

      unmount();

      // 元の description に戻っている
      expect(getMetaDescription()).toBe(originalDescription);
    });
  });

  describe('未定義のパス', () => {
    it('マッピングにないパスではデフォルトの description が維持されること', () => {
      mockPathname.pathname = '/unknown-page';
      renderHook(() => useMetaDescription());

      expect(getMetaDescription()).toBe(originalDescription);
    });
  });
});
