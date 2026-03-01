import { useEffect, useRef } from 'react';

/**
 * IntersectionObserver ベースのスクロールアニメーションフック
 * 要素が画面に入るときにフェードイン・スライドアップする
 *
 * 使い方: ref を対象要素の親（グリッド等）に渡すと、直下の子要素にアニメーションが適用される
 */
export const useScrollReveal = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const children = container.children;

    // 初期状態: 非表示
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      child.style.opacity = '0';
      child.style.transform = 'translateY(30px)';
      child.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      // 各カードにわずかな遅延を追加
      child.style.transitionDelay = `${i * 0.08}s`;
      observer.observe(child);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return ref;
};
