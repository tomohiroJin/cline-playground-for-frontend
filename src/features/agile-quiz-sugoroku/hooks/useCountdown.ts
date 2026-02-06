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
  const prevTimeRef = useRef(limit);

  // コールバックを常に最新に保つ
  useEffect(() => {
    callbackRef.current = onExpire;
  }, [onExpire]);

  // 残り5秒以下でティック音を再生（setTime外で副作用を実行）
  useEffect(() => {
    // タイマーが減少した時のみ（リセット時は鳴らさない）
    if (time < prevTimeRef.current && time <= 5 && time > 0) {
      playSfxTick();
    }
    prevTimeRef.current = time;
  }, [time]);

  const start = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setTime(limit);
    prevTimeRef.current = limit;

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
        return prev - 1;
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
