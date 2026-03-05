import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useCanonicalUrl } from '../useCanonicalUrl';
import { SITE_BASE_URL } from '../../constants/game-seo-data';

/** canonical リンク要素を取得するヘルパー */
const getCanonicalLink = (): HTMLLinkElement | null =>
  document.querySelector('link[rel="canonical"]');

/** MemoryRouter でラップする wrapper を生成 */
const createWrapper =
  (initialPath: string) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [initialPath] }, children);

describe('useCanonicalUrl', () => {
  let originalLink: HTMLLinkElement;

  beforeEach(() => {
    // テスト用の canonical リンクを準備
    let link = getCanonicalLink();
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${SITE_BASE_URL}/`;
    originalLink = link;
  });

  afterEach(() => {
    // canonical リンクをデフォルトに復元
    originalLink.href = `${SITE_BASE_URL}/`;
  });

  it('トップページで正しい canonical URL が設定されること', () => {
    renderHook(() => useCanonicalUrl(), {
      wrapper: createWrapper('/'),
    });

    const link = getCanonicalLink();
    expect(link?.href).toBe(`${SITE_BASE_URL}/`);
  });

  it('About ページで正しい canonical URL が設定されること', () => {
    renderHook(() => useCanonicalUrl(), {
      wrapper: createWrapper('/about'),
    });

    const link = getCanonicalLink();
    expect(link?.href).toBe(`${SITE_BASE_URL}/about`);
  });

  it('ゲームページで正しい canonical URL が設定されること', () => {
    renderHook(() => useCanonicalUrl(), {
      wrapper: createWrapper('/puzzle'),
    });

    const link = getCanonicalLink();
    expect(link?.href).toBe(`${SITE_BASE_URL}/puzzle`);
  });

  it('トレイリングスラッシュが正規化されること', () => {
    renderHook(() => useCanonicalUrl(), {
      wrapper: createWrapper('/about/'),
    });

    const link = getCanonicalLink();
    expect(link?.href).toBe(`${SITE_BASE_URL}/about`);
  });

  it('アンマウント時にトップページ URL に戻ること', () => {
    const { unmount } = renderHook(() => useCanonicalUrl(), {
      wrapper: createWrapper('/about'),
    });

    expect(getCanonicalLink()?.href).toBe(`${SITE_BASE_URL}/about`);

    unmount();

    expect(getCanonicalLink()?.href).toBe(`${SITE_BASE_URL}/`);
  });
});
