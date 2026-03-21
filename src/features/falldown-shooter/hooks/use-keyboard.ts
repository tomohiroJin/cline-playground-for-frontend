// キーボード入力フック

import { useEffect } from 'react';
import type { KeyboardHandlers } from '../types';

/** キーボード入力を処理する */
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
