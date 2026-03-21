// アイドルタイマーフック

import { useEffect, useRef, useCallback } from 'react';

/** 一定時間操作がない場合にコールバックを実行する */
export const useIdleTimer = (
  timeout: number,
  onIdle: () => void,
  enabled: boolean
): (() => void) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) timerRef.current = setTimeout(onIdle, timeout);
  }, [timeout, onIdle, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    reset();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, reset]);

  return reset;
};
