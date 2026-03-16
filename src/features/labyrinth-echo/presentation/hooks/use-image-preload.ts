/**
 * 迷宮の残響 - useImagePreload フック
 *
 * 画像プリロードを管理する。
 */
import { useEffect } from 'react';

/** 画像プリロードフック */
export const useImagePreload = (urls: string[]): void => {
  useEffect(() => {
    urls.forEach(url => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    });
  }, [urls]);
};
