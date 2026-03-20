import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { puzzleStartTimeAtom, gameElapsedTimeAtom } from '../store/game-atoms';
import { puzzleBoardStateAtom } from '../store/puzzle-atoms';

/**
 * パズルのタイマーを管理するカスタムフック
 * ゲーム開始後、完了するまで毎秒経過時間を更新する
 */
export const usePuzzleTimer = () => {
  const [startTime] = useAtom(puzzleStartTimeAtom);
  const [, setElapsedTime] = useAtom(gameElapsedTimeAtom);
  const [boardState] = useAtom(puzzleBoardStateAtom);

  const completed = boardState?.isCompleted ?? false;

  useEffect(() => {
    if (!startTime || completed) return;

    const intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime, completed, setElapsedTime]);
};
