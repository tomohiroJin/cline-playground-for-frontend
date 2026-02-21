import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { puzzleStartTimeAtom, puzzleElapsedTimeAtom, puzzleCompletedAtom } from '../store/atoms';

/**
 * パズルのタイマーを管理するカスタムフック
 * ゲーム開始後、完了するまで毎秒経過時間を更新する
 */
export const usePuzzleTimer = () => {
  const [startTime] = useAtom(puzzleStartTimeAtom);
  const [, setElapsedTime] = useAtom(puzzleElapsedTimeAtom);
  const [completed] = useAtom(puzzleCompletedAtom);

  useEffect(() => {
    if (!startTime || completed) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime, completed, setElapsedTime]);
};
