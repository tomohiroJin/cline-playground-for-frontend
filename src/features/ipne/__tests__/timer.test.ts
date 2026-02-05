/**
 * タイマーシステムのテスト
 */
import {
  createTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getElapsedTime,
  formatTime,
  formatTimeShort,
  isTimerRunning,
  isTimerPaused,
} from '../timer';
import { TimerState } from '../types';

describe('timer', () => {
  describe('createTimer', () => {
    test('初期状態のタイマーを作成すること', () => {
      const timer = createTimer();

      expect(timer.state).toBe(TimerState.IDLE);
      expect(timer.startTime).toBe(0);
      expect(timer.pausedTime).toBe(0);
      expect(timer.totalPausedDuration).toBe(0);
    });
  });

  describe('startTimer', () => {
    test('タイマーを開始すること', () => {
      const timer = createTimer();
      const now = 1000;

      const started = startTimer(timer, now);

      expect(started.state).toBe(TimerState.RUNNING);
      expect(started.startTime).toBe(1000);
    });

    test('既に実行中の場合は何もしないこと', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const startedAgain = startTimer(started, 2000);

      expect(startedAgain.startTime).toBe(1000);
    });
  });

  describe('pauseTimer', () => {
    test('タイマーを一時停止すること', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const paused = pauseTimer(started, 2000);

      expect(paused.state).toBe(TimerState.PAUSED);
      expect(paused.pausedTime).toBe(2000);
    });

    test('実行中でない場合は何もしないこと', () => {
      const timer = createTimer();
      const paused = pauseTimer(timer, 1000);

      expect(paused.state).toBe(TimerState.IDLE);
    });
  });

  describe('resumeTimer', () => {
    test('タイマーを再開すること', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const paused = pauseTimer(started, 2000);
      const resumed = resumeTimer(paused, 3000);

      expect(resumed.state).toBe(TimerState.RUNNING);
      expect(resumed.pausedTime).toBe(0);
      expect(resumed.totalPausedDuration).toBe(1000);
    });

    test('一時停止中でない場合は何もしないこと', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const resumed = resumeTimer(started, 2000);

      expect(resumed.state).toBe(TimerState.RUNNING);
      expect(resumed.totalPausedDuration).toBe(0);
    });
  });

  describe('stopTimer', () => {
    test('実行中のタイマーを停止すること', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const stopped = stopTimer(started, 5000);

      expect(stopped.state).toBe(TimerState.STOPPED);
    });

    test('一時停止中のタイマーを停止すること', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const paused = pauseTimer(started, 2000);
      const stopped = stopTimer(paused, 3000);

      expect(stopped.state).toBe(TimerState.STOPPED);
      expect(stopped.totalPausedDuration).toBe(1000);
    });

    test('IDLE状態からは停止できないこと', () => {
      const timer = createTimer();
      const stopped = stopTimer(timer, 1000);

      expect(stopped.state).toBe(TimerState.IDLE);
    });
  });

  describe('getElapsedTime', () => {
    test('IDLE状態では0を返すこと', () => {
      const timer = createTimer();
      expect(getElapsedTime(timer, 5000)).toBe(0);
    });

    test('実行中の経過時間を返すこと', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const elapsed = getElapsedTime(started, 4000);

      expect(elapsed).toBe(3000);
    });

    test('一時停止中の経過時間を返すこと', () => {
      const timer = createTimer();
      const started = startTimer(timer, 1000);
      const paused = pauseTimer(started, 3000);
      const elapsed = getElapsedTime(paused, 5000);

      expect(elapsed).toBe(2000);
    });

    test('一時停止時間を差し引いた経過時間を返すこと', () => {
      const timer = createTimer();
      let current = startTimer(timer, 1000);
      current = pauseTimer(current, 2000);
      current = resumeTimer(current, 3000);
      const elapsed = getElapsedTime(current, 5000);

      expect(elapsed).toBe(3000);
    });

    test('複数回の一時停止を考慮すること', () => {
      const timer = createTimer();
      let current = startTimer(timer, 1000);
      current = pauseTimer(current, 2000);
      current = resumeTimer(current, 3000);
      current = pauseTimer(current, 4000);
      current = resumeTimer(current, 5000);
      const elapsed = getElapsedTime(current, 7000);

      expect(elapsed).toBe(4000);
    });
  });

  describe('formatTime', () => {
    test('0ミリ秒をフォーマットすること', () => {
      expect(formatTime(0)).toBe('00:00.000');
    });

    test('1秒をフォーマットすること', () => {
      expect(formatTime(1000)).toBe('00:01.000');
    });

    test('1分をフォーマットすること', () => {
      expect(formatTime(60000)).toBe('01:00.000');
    });

    test('1分30秒500ミリ秒をフォーマットすること', () => {
      expect(formatTime(90500)).toBe('01:30.500');
    });

    test('10分5秒をフォーマットすること', () => {
      expect(formatTime(605000)).toBe('10:05.000');
    });
  });

  describe('formatTimeShort', () => {
    test('0ミリ秒をフォーマットすること', () => {
      expect(formatTimeShort(0)).toBe('00:00');
    });

    test('1秒をフォーマットすること', () => {
      expect(formatTimeShort(1000)).toBe('00:01');
    });

    test('1分30秒をフォーマットすること', () => {
      expect(formatTimeShort(90000)).toBe('01:30');
    });
  });

  describe('isTimerRunning', () => {
    test('実行中の場合trueを返すこと', () => {
      const timer = startTimer(createTimer(), 1000);
      expect(isTimerRunning(timer)).toBe(true);
    });

    test('一時停止中の場合falseを返すこと', () => {
      const timer = pauseTimer(startTimer(createTimer(), 1000), 2000);
      expect(isTimerRunning(timer)).toBe(false);
    });
  });

  describe('isTimerPaused', () => {
    test('一時停止中の場合trueを返すこと', () => {
      const timer = pauseTimer(startTimer(createTimer(), 1000), 2000);
      expect(isTimerPaused(timer)).toBe(true);
    });

    test('実行中の場合falseを返すこと', () => {
      const timer = startTimer(createTimer(), 1000);
      expect(isTimerPaused(timer)).toBe(false);
    });
  });
});
