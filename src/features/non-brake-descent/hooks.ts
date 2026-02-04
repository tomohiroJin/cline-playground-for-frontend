import { useCallback, useEffect, useRef, useState } from 'react';

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

export const useCheatCode = (code: string, onMatch: () => void): ((key: string) => void) => {
  const buffer = useRef('');
  return useCallback(
    (key: string) => {
      if (key.length !== 1) return;
      buffer.current = (buffer.current + key.toLowerCase()).slice(-code.length);
      if (buffer.current === code) {
        onMatch();
        buffer.current = '';
      }
    },
    [code, onMatch]
  );
};
