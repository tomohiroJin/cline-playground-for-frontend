// 落ち物シューティング カスタムフック

import { useEffect, useRef, useCallback } from 'react';
import type { KeyboardHandlers } from './types';

export const useInterval = (callback: () => void, delay: number, enabled: boolean): void => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay, enabled]);
};

export const useKeyboard = (enabled: boolean, handlers: KeyboardHandlers): void => {
  useEffect(() => {
    if (!enabled) return;

    const keyMap: Record<string, () => void> = {
      ArrowLeft: handlers.left,
      ArrowRight: handlers.right,
      ' ': handlers.fire,
      ArrowUp: handlers.fire,
      '1': handlers.skill1,
      '2': handlers.skill2,
      '3': handlers.skill3,
      ...(handlers.pause ? { Escape: handlers.pause, p: handlers.pause, P: handlers.pause } : {}),
    };

    const handle = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [enabled, handlers]);
};

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
