import { useEffect, useRef } from 'react';

/** 各子要素間のアニメーション遅延（秒） */
const DELAY_PER_ITEM = 0.08;

/** スクロール検出のしきい値 */
const OBSERVER_THRESHOLD = 0.1;

/** 下方向のルートマージン（要素が少し見えてからアニメーション開始） */
const OBSERVER_ROOT_MARGIN = '0px 0px -50px 0px';

/**
 * スクロールアニメーションフック
 *
 * ref を受け取った要素の直下の子要素すべてに対して、
 * スクロールで画面に入ったタイミングでフェードイン・スライドアップのアニメーションを適用する。
 *
 * - 初期状態: opacity: 0, translateY(30px)
 * - 表示時: opacity: 1, translateY(0)
 * - 各要素に index × 0.08s の transitionDelay を設定して連鎖的にアニメーション
 * - 画面外に出ると再び非表示状態に戻り、何度でもフェードインを繰り返す
 */
export const useScrollReveal = <T extends HTMLElement>(): React.RefObject<T | null> => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // アニメーション軽減設定が有効な場合はスキップ
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    // 子要素に初期スタイルを適用
    children.forEach((child, index) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(30px)';
      child.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      child.style.transitionDelay = `${index * DELAY_PER_ITEM}s`;
    });

    // IntersectionObserver で監視（画面外に出たら再び非表示に戻す）
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            target.style.opacity = '1';
            target.style.transform = 'translateY(0)';
          } else {
            target.style.opacity = '0';
            target.style.transform = 'translateY(30px)';
          }
        });
      },
      {
        threshold: OBSERVER_THRESHOLD,
        rootMargin: OBSERVER_ROOT_MARGIN,
      }
    );

    children.forEach((child) => observer.observe(child));

    return () => {
      observer.disconnect();
    };
  }, []);

  return ref;
};
