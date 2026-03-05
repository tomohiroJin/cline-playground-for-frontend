import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GAME_SEO_DATA, SITE_BASE_URL } from '../constants/game-seo-data';

/**
 * ホームページ用 ItemList 構造化データを挿入するフック
 *
 * ホームページ（/）でのみ動作し、それ以外のパスではスキップする。
 * アンマウント時にクリーンアップする。
 */
export const useItemListSchema = (): void => {
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) return;

    const gameEntries = Object.values(GAME_SEO_DATA);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${SITE_BASE_URL}/#gamelist`,
      name: 'Game Platform ゲーム一覧',
      description: '13種類の無料ブラウザゲーム',
      numberOfItems: gameEntries.length,
      itemListElement: gameEntries.map((game, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_BASE_URL}${game.path}`,
        name: game.name,
        description: game.description,
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    // XSS 対策: textContent で安全に挿入
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isHomePage]);
};
