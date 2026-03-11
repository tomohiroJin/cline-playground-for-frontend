/**
 * 原始進化録 - PRIMAL PATH - useOverlay フック
 *
 * 通知オーバーレイの表示/非表示管理
 */
import { useState, useRef, useCallback, useEffect } from 'react';

/** オーバーレイの表示状態 */
export interface OverlayState {
  visible: boolean;
  icon: string;
  text: string;
}

/** オーバーレイ管理フック */
export function useOverlay() {
  const [overlay, setOverlay] = useState<OverlayState>({ visible: false, icon: '', text: '' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const showOverlay = useCallback((icon: string, text: string, ms = 1200): Promise<void> => {
    return new Promise(resolve => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resolveRef.current) resolveRef.current();
      resolveRef.current = resolve;
      setOverlay({ visible: true, icon, text });
      timerRef.current = setTimeout(() => {
        setOverlay({ visible: false, icon: '', text: '' });
        resolveRef.current = null;
        resolve();
      }, ms);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resolveRef.current) resolveRef.current();
    };
  }, []);

  return { overlay, showOverlay };
}
