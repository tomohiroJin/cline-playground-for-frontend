// アイドル検出フック（旧 hooks.ts から移行）

import { useEffect, useState } from 'react';

export const useIdle = (
  active: boolean,
  timeout: number,
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  // idle はカウンター目的でのみ使用
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
      1000,
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
