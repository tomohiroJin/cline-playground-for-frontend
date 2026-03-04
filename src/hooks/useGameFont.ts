import { useEffect, useRef } from 'react';

/** ゲーム専用フォントの定義 */
const GAME_FONTS: Record<string, string> = {
  'risk-lcd': 'family=Silkscreen:wght@400;700',
  'keys-and-arms': 'family=Press+Start+2P',
};

/**
 * ゲーム専用フォントを動的に読み込むフック
 * ゲームページに遷移した際にのみフォントを読み込み、
 * ページ離脱時に link 要素を削除する
 */
export const useGameFont = (gameId: string): void => {
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    const fontParam = GAME_FONTS[gameId];
    if (!fontParam) return;

    const href = `https://fonts.googleapis.com/css2?${fontParam}&display=swap`;

    // 既に同じフォントが読み込まれている場合はスキップ
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    linkRef.current = link;

    return () => {
      if (linkRef.current && document.head.contains(linkRef.current)) {
        document.head.removeChild(linkRef.current);
        linkRef.current = null;
      }
    };
  }, [gameId]);
};
