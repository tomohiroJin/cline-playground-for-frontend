// アンマウント安全なsetTimeoutフック

import { useCallback, useRef, useEffect } from 'react';

/**
 * アンマウント時に自動クリーンアップされるsetTimeoutフック
 * 複数のタイマーを安全に管理する
 */
export const useSafeTimeout = () => {
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const clearSafeTimeout = useCallback((timer: ReturnType<typeof setTimeout>) => {
    clearTimeout(timer);
    timersRef.current.delete(timer);
  }, []);

  return { setSafeTimeout, clearSafeTimeout };
};
