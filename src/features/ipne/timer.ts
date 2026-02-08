/**
 * IPNE ゲームタイマーシステム
 *
 * ゲームプレイ時間の計測と管理を担当
 */

import { GameTimer, TimerState } from './types';

// 型の再エクスポート
export type { GameTimer } from './types';

/**
 * 新しいタイマーを作成する
 * @returns 初期状態のゲームタイマー
 */
export function createTimer(): GameTimer {
  return {
    state: TimerState.IDLE,
    startTime: 0,
    pausedTime: 0,
    totalPausedDuration: 0,
  };
}

/**
 * タイマーを開始する
 * @param timer 現在のタイマー
 * @param now 現在時刻（ミリ秒）- テスト用にオプショナル
 * @returns 更新されたタイマー
 */
export function startTimer(timer: GameTimer, now: number = Date.now()): GameTimer {
  // 既に実行中の場合は何もしない
  if (timer.state === TimerState.RUNNING) {
    return timer;
  }

  return {
    ...timer,
    state: TimerState.RUNNING,
    startTime: now,
    pausedTime: 0,
    totalPausedDuration: 0,
  };
}

/**
 * タイマーを一時停止する
 * @param timer 現在のタイマー
 * @param now 現在時刻（ミリ秒）- テスト用にオプショナル
 * @returns 更新されたタイマー
 */
export function pauseTimer(timer: GameTimer, now: number = Date.now()): GameTimer {
  // 実行中でない場合は何もしない
  if (timer.state !== TimerState.RUNNING) {
    return timer;
  }

  return {
    ...timer,
    state: TimerState.PAUSED,
    pausedTime: now,
  };
}

/**
 * タイマーを再開する
 * @param timer 現在のタイマー
 * @param now 現在時刻（ミリ秒）- テスト用にオプショナル
 * @returns 更新されたタイマー
 */
export function resumeTimer(timer: GameTimer, now: number = Date.now()): GameTimer {
  // 一時停止中でない場合は何もしない
  if (timer.state !== TimerState.PAUSED) {
    return timer;
  }

  const pausedDuration = now - timer.pausedTime;

  return {
    ...timer,
    state: TimerState.RUNNING,
    pausedTime: 0,
    totalPausedDuration: timer.totalPausedDuration + pausedDuration,
  };
}

/**
 * タイマーを停止する
 * @param timer 現在のタイマー
 * @param now 現在時刻（ミリ秒）- テスト用にオプショナル
 * @returns 更新されたタイマー
 */
export function stopTimer(timer: GameTimer, now: number = Date.now()): GameTimer {
  // IDLE状態からは停止できない
  if (timer.state === TimerState.IDLE || timer.state === TimerState.STOPPED) {
    return timer;
  }

  // 一時停止中の場合は、停止時点までの一時停止時間を加算
  let finalPausedDuration = timer.totalPausedDuration;
  if (timer.state === TimerState.PAUSED) {
    finalPausedDuration += now - timer.pausedTime;
  }

  return {
    ...timer,
    state: TimerState.STOPPED,
    pausedTime: 0,
    totalPausedDuration: finalPausedDuration,
  };
}

/**
 * 経過時間を取得する
 * @param timer 現在のタイマー
 * @param now 現在時刻（ミリ秒）- テスト用にオプショナル
 * @returns 経過時間（ミリ秒）
 */
export function getElapsedTime(timer: GameTimer, now: number = Date.now()): number {
  if (timer.state === TimerState.IDLE) {
    return 0;
  }

  if (timer.state === TimerState.STOPPED) {
    // 停止時点での経過時間を返す
    const totalTime = now - timer.startTime;
    return Math.max(0, totalTime - timer.totalPausedDuration);
  }

  if (timer.state === TimerState.PAUSED) {
    // 一時停止時点での経過時間を返す
    const timeBeforePause = timer.pausedTime - timer.startTime;
    return Math.max(0, timeBeforePause - timer.totalPausedDuration);
  }

  // 実行中の場合
  const totalTime = now - timer.startTime;
  return Math.max(0, totalTime - timer.totalPausedDuration);
}

/**
 * 経過時間をフォーマットする
 * @param timeMs 経過時間（ミリ秒）
 * @returns フォーマットされた文字列（MM:SS.mmm）
 */
export function formatTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = timeMs % 1000;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');

  return `${mm}:${ss}.${mmm}`;
}

/**
 * 経過時間を短縮形式でフォーマットする（表示用）
 * @param timeMs 経過時間（ミリ秒）
 * @returns フォーマットされた文字列（MM:SS）
 */
export function formatTimeShort(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${mm}:${ss}`;
}

/**
 * タイマーが実行中かどうかを確認する
 * @param timer 現在のタイマー
 * @returns 実行中の場合true
 */
export function isTimerRunning(timer: GameTimer): boolean {
  return timer.state === TimerState.RUNNING;
}

/**
 * タイマーが一時停止中かどうかを確認する
 * @param timer 現在のタイマー
 * @returns 一時停止中の場合true
 */
export function isTimerPaused(timer: GameTimer): boolean {
  return timer.state === TimerState.PAUSED;
}
