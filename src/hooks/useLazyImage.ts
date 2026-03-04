import { useState, useEffect, useRef } from 'react';

/**
 * IntersectionObserver を使って画像を遅延読み込みするフック
 * ビューポートに入ったタイミングで dynamic import を実行する
 */
export const useLazyImage = (
  importFn: () => Promise<{ default: string }>,
  /** すぐに読み込むかどうか（ファーストビュー用） */
  eager = false
): { ref: React.RefObject<HTMLDivElement | null>; src: string | undefined } => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState<string | undefined>(undefined);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;

    const load = async () => {
      if (loadedRef.current) return;
      loadedRef.current = true;
      const mod = await importFn();
      setSrc(mod.default);
    };

    // eager の場合は即座に読み込む
    if (eager) {
      load();
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            load();
            observer.disconnect();
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [importFn, eager]);

  return { ref, src };
};
