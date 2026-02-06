/**
 * カウントダウンタイマーフック
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { playSfxTick } from '../audio/sound';

interface UseCountdownReturn {
  /** 現在の残り時間（秒） */
  time: number;
  /** タイマーを開始 */
  start: () => void;
  /** タイマーを停止 */
  stop: () => void;
}

/**
 * カウントダウンタイマー
 * @param limit 制限時間（秒）
 * @param onExpire 時間切れ時のコールバック
 */
export function useCountdown(
  limit: number,
  onExpire?: () => void
): UseCountdownReturn {
  const [time, setTime] = useState(limit);
  const intervalRef = useRef<number | null>(null);
  const callbackRef = useRef(onExpire);

  // コールバックを常に最新に保つ
  useEffect(() => {
    callbackRef.current = onExpire;
  }, [onExpire]);

  const start = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setTime(limit);

    intervalRef.current = window.setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // コールバックはsetTimeの外で呼び出す（ステート更新中のステート更新を避ける）
          setTimeout(() => {
            if (callbackRef.current) {
              callbackRef.current();
            }
          }, 0);
          return 0;
        }
        const next = prev - 1;
        // 残り5秒以下でティック音
        if (next <= 5 && next > 0) {
          playSfxTick();
        }
        return next;
      });
    }, 1000);
  }, [limit]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { time, start, stop };
}
