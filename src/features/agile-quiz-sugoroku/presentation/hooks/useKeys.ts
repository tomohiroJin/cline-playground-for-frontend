/**
 * キーボード操作用フック
 */
import { useEffect, useRef } from 'react';

/**
 * キーボードイベントリスナー
 * @param handler キーダウン時のハンドラ
 */
export function useKeys(handler: (event: KeyboardEvent) => void): void {
  const handlerRef = useRef(handler);

  // ハンドラを常に最新に保つ
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handlerRef.current(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
