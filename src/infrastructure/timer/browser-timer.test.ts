/**
 * BrowserTimer のテスト
 *
 * start/stop/getElapsed の状態遷移を Date.now のモックで検証する。
 */
import { BrowserTimer } from './browser-timer';

describe('BrowserTimer', () => {
  let nowSpy: jest.SpyInstance;
  let current = 0;

  beforeEach(() => {
    current = 0;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => current);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('開始前の経過時間は 0 を返す', () => {
    const timer = new BrowserTimer();
    expect(timer.getElapsed()).toBe(0);
  });

  it('start 後は経過秒数を返す', () => {
    const timer = new BrowserTimer();
    timer.start();
    current = 5000; // 5秒経過
    expect(timer.getElapsed()).toBe(5);
  });

  it('stop すると経過時間を保持し、以後時間が進んでも変化しない', () => {
    const timer = new BrowserTimer();
    timer.start();
    current = 3000;
    timer.stop();
    current = 10000; // 停止後さらに経過
    expect(timer.getElapsed()).toBe(3);
  });

  it('start はタイマーをリセットする', () => {
    const timer = new BrowserTimer();
    timer.start();
    current = 8000;
    timer.stop();
    expect(timer.getElapsed()).toBe(8);

    // 再 start で経過時間がリセットされる
    current = 8000;
    timer.start();
    current = 9000;
    expect(timer.getElapsed()).toBe(1);
  });
});
