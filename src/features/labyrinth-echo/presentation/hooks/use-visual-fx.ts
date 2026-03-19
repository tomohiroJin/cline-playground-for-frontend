/**
 * 迷宮の残響 - useVisualFx フック
 *
 * ビジュアルエフェクト（シェイク、フラッシュ）を管理する。
 */
import { useState, useCallback, useEffect, useRef } from 'react';

/** ビジュアルエフェクトフック */
export const useVisualFx = () => {
  const [shake, setShake] = useState(false);
  const [overlay, setOverlay] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
      if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const flash = useCallback((type: string, ms: number) => {
    setOverlay(type);
    if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setOverlay(null), ms);
  }, []);

  const doShake = useCallback(() => {
    setShake(true);
    if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShake(false), 350);
  }, []);

  return { shake, overlay, flash, doShake };
};
