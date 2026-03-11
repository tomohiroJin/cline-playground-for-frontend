/**
 * ヒットフラッシュ管理フック
 * 敵被弾時のフラッシュアニメーション状態を管理
 */
import { useState, useRef, useEffect, useCallback } from 'react';

const HIT_FLASH_DURATION_MS = 400;

export function useHitFlash() {
  const [isHit, setIsHit] = useState(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const triggerHit = useCallback(() => {
    setIsHit(true);
    const tid = setTimeout(() => {
      timersRef.current.delete(tid);
      setIsHit(false);
    }, HIT_FLASH_DURATION_MS);
    timersRef.current.add(tid);
  }, []);

  return { isHit, triggerHit };
}
