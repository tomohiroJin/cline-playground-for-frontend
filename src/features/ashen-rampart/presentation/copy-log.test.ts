import { copyLogToClipboard } from './copy-log';

describe('copyLogToClipboard', () => {
  it('Clipboard API があれば書き込んで true を返す', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    await expect(copyLogToClipboard('{"a":1}')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('{"a":1}');
  });

  it('Clipboard API が無ければコンソールへ出して false を返す（記録を失わない）', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await expect(copyLogToClipboard('{"a":1}')).resolves.toBe(false);
    expect(logSpy).toHaveBeenCalledWith('{"a":1}');
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});
