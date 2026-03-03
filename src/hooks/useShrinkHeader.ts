import { useState, useEffect } from 'react';

/** スクロール位置に応じてヘッダーを縮小するかどうかを返す */
interface ShrinkHeaderState {
  isScrolled: boolean;
}

const DEFAULT_THRESHOLD = 50;

/**
 * スクロール時ヘッダー縮小フック
 *
 * スクロール位置が threshold を超えると isScrolled が true になる。
 * passive: true のスクロールリスナーを使用。
 */
export const useShrinkHeader = (threshold = DEFAULT_THRESHOLD): ShrinkHeaderState => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isScrolled };
};
