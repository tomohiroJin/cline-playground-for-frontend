// Racing Game カスタムフック

import { useEffect, useRef, useState, useCallback } from 'react';

export const useInput = () => {
  const keys = useRef<Record<string, boolean>>({});
  const touch = useRef({ L: false, R: false });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      // コードベースのキー追跡（ハンドブレーキ用にShiftキーを識別）
      if (e.code) keys.current[`code:${e.code}`] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key))
        e.preventDefault();
    };
    const ku = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
      if (e.code) keys.current[`code:${e.code}`] = false;
    };
    const blur = () => {
      keys.current = {};
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const setTouch = useCallback((side: 'L' | 'R', active: boolean) => {
    if (touch.current) touch.current[side] = active;
  }, []);

  return { keys, touch, setTouch };
};

export const useIdle = (
  active: boolean,
  timeout: number
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  // idle はカウンター目的でのみ使用、直接の読み取りは不要
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [idle, setIdle] = useState(0);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (!active) {

      setIdle(0);
      setDemo(false);
      return;
    }
    const timer = setInterval(
      () =>
        setIdle(t => {
          if (t >= timeout && !demo) setDemo(true);
          return t + 1;
        }),
      1000
    );
    const reset = () => {
      setIdle(0);
      if (demo) setDemo(false);
    };
    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearInterval(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [active, timeout, demo]);

  return [demo, setDemo];
};
