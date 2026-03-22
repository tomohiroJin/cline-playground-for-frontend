/**
 * モバイル判定フック
 *
 * 既存の useIsMobile を presentation 層に移行する。
 */
import { useEffect, useState } from 'react';

/** タッチデバイスかどうかを判定するフック */
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
