import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { META_DESCRIPTIONS } from '../constants/game-seo-data';

/**
 * 現在のルートに応じて <meta name="description"> の content を動的に更新するフック
 * アンマウント時に元の description に戻す
 */
export const useMetaDescription = (): void => {
  const { pathname } = useLocation();
  const originalDescriptionRef = useRef<string>('');

  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    if (!meta) return;

    // 初回のみ元の description を保存
    if (!originalDescriptionRef.current) {
      originalDescriptionRef.current = meta.getAttribute('content') ?? '';
    }

    const description = META_DESCRIPTIONS[pathname];
    if (description) {
      meta.setAttribute('content', description);
    }

    return () => {
      if (originalDescriptionRef.current) {
        meta.setAttribute('content', originalDescriptionRef.current);
      }
    };
  }, [pathname]);
};
