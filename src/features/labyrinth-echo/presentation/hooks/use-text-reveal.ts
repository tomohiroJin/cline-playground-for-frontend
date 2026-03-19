/**
 * 迷宮の残響 - useTextReveal フック
 *
 * テキスト逐次表示（タイプライター効果）を管理する。
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { AudioEngine } from '../../audio';

/** テキスト逐次表示フック */
export const useTextReveal = (text: string | null, audioOn: boolean) => {
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    if (!text) return;

    setPos(0); setReady(false); tickRef.current = 0;
    if (timerRef.current !== null) clearInterval(timerRef.current);
    if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    timerRef.current = setInterval(() => {
      setPos(p => {
        const n = Math.min(p + 2, text.length);
        tickRef.current++;
        if (audioOn && tickRef.current % 3 === 0) AudioEngine.sfx.tick();
        if (n >= text.length) {
          if (timerRef.current !== null) clearInterval(timerRef.current);
          readyTimerRef.current = setTimeout(() => setReady(true), 200);
        }
        return n;
      });
    }, 18);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    };
  }, [text, audioOn]);

  const skip = useCallback(() => {
    if (!text) return;
    if (timerRef.current !== null) clearInterval(timerRef.current);
    if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    setPos(text.length);
    readyTimerRef.current = setTimeout(() => setReady(true), 50);
  }, [text]);

  return { revealed: text?.slice(0, pos) ?? "", done: pos >= (text?.length ?? 0), ready, skip };
};
