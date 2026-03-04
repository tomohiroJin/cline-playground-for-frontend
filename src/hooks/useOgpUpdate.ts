import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GAME_SEO_DATA, SITE_BASE_URL, SITE_NAME } from '../constants/game-seo-data';

/** 保存する元の OGP 値 */
interface OriginalOgp {
  readonly title: string;
  readonly description: string;
  readonly url: string;
}

/** OGP メタタグの content を取得 */
const getOgContent = (property: string): string =>
  document.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ?? '';

/** OGP メタタグの content を設定 */
const setOgContent = (property: string, content: string): void => {
  const meta = document.querySelector(`meta[property="${property}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  }
};

/**
 * 現在のルートに応じて OGP メタタグを動的に更新するフック
 * SNS クローラーは JS を実行しないため効果は限定的だが、
 * 将来の SSR 導入時のベース実装として位置づけ
 */
export const useOgpUpdate = (): void => {
  const { pathname } = useLocation();
  const originalRef = useRef<OriginalOgp | undefined>(undefined);

  useEffect(() => {
    // 初回のみ元の OGP 値を保存
    if (originalRef.current === undefined) {
      originalRef.current = {
        title: getOgContent('og:title'),
        description: getOgContent('og:description'),
        url: getOgContent('og:url'),
      };
    }

    const gameData = GAME_SEO_DATA[pathname];
    if (gameData) {
      setOgContent('og:title', `${gameData.name} - ${SITE_NAME}`);
      setOgContent('og:description', gameData.description);
      setOgContent('og:url', `${SITE_BASE_URL}${gameData.path}`);
    }

    return () => {
      if (originalRef.current) {
        setOgContent('og:title', originalRef.current.title);
        setOgContent('og:description', originalRef.current.description);
        setOgContent('og:url', originalRef.current.url);
      }
    };
  }, [pathname]);
};
