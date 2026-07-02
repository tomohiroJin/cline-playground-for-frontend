/**
 * モバイル触覚ラッパのテスト
 * - jsdom 既定では navigator.vibrate は未定義のため、必要な場合のみ注入する
 */
import { vibrate } from './haptics';

describe('vibrate', () => {
  const setVibrate = (fn: ((pattern: number | number[]) => boolean) | undefined) => {
    Object.defineProperty(window.navigator, 'vibrate', {
      value: fn,
      configurable: true,
      writable: true,
    });
  };

  afterEach(() => {
    // 後続テストへ影響しないよう削除
    setVibrate(undefined);
  });

  it('対応環境では指定 ms で navigator.vibrate を呼ぶ', () => {
    const spy = jest.fn(() => true);
    setVibrate(spy);
    vibrate(20);
    expect(spy).toHaveBeenCalledWith(20);
  });

  it('ms が 0 以下なら navigator.vibrate を呼ばない', () => {
    const spy = jest.fn(() => true);
    setVibrate(spy);
    vibrate(0);
    vibrate(-5);
    expect(spy).not.toHaveBeenCalled();
  });

  it('navigator.vibrate 未対応環境でも例外を投げない', () => {
    setVibrate(undefined);
    expect(() => vibrate(20)).not.toThrow();
  });

  it('navigator.vibrate が例外を投げても握りつぶす', () => {
    setVibrate(() => {
      throw new Error('not allowed');
    });
    expect(() => vibrate(20)).not.toThrow();
  });
});
