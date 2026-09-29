/**
 * ブリーフィング既読フラグ（briefing-seen.ts）のテスト（PR #211 Fix G）
 *
 * localStorage を直に触るだけの薄いモジュールだが、ExpeditionView・AshenRampartGame
 * の両方から参照され、コロケートされたテストが無いまま残っていた。
 */
import { readBriefingSeen, markBriefingSeen } from './briefing-seen';

describe('briefing-seen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('初期状態では未読（false）を返す', () => {
    expect(readBriefingSeen()).toBe(false);
  });

  it('markBriefingSeen を呼んだ後は既読（true）を返す', () => {
    markBriefingSeen();
    expect(readBriefingSeen()).toBe(true);
  });

  it('localStorage.getItem が例外を投げても未読として扱い、エラーを投げない', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('blocked');
    });

    expect(readBriefingSeen()).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('localStorage.setItem が例外を投げても markBriefingSeen はエラーを投げない', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });

    expect(() => markBriefingSeen()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
