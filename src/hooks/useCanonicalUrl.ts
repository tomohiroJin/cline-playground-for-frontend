import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_BASE_URL } from '../constants/game-seo-data';

/**
 * 現在のパスに対応する canonical URL を動的に設定するフック
 *
 * index.html の <link rel="canonical"> を動的更新する。
 * トレイリングスラッシュの正規化を行う。
 * アンマウント時にトップページ URL に戻す。
 */
export const useCanonicalUrl = (): void => {
  const { pathname } = useLocation();

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) return;

    // トレイリングスラッシュの正規化（ルート "/" は除く）
    const normalizedPath =
      pathname !== '/' && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname;

    const canonicalUrl =
      normalizedPath === '/'
        ? `${SITE_BASE_URL}/`
        : `${SITE_BASE_URL}${normalizedPath}`;

    link.href = canonicalUrl;

    return () => {
      link.href = `${SITE_BASE_URL}/`;
    };
  }, [pathname]);
};
