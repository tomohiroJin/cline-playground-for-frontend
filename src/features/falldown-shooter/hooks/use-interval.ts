// 定間隔実行フック

import { useEffect, useRef } from 'react';

/** コールバックを一定間隔で実行する */
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
