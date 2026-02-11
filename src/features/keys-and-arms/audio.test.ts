import { KeysAndArmsAudio } from './audio';

describe('KeysAndArmsAudio', () => {
  it('loop に応じた beat length を返す', () => {
    const audio = new KeysAndArmsAudio();
    expect(audio.getBeatLength(1)).toBe(34);
    expect(audio.getBeatLength(2)).toBe(27);
    expect(audio.getBeatLength(3)).toBe(20);
    expect(audio.getBeatLength(5)).toBe(16);
  });

  it('cave の BGM tick で指定拍に応じた音を鳴らす', () => {
    const audio = new KeysAndArmsAudio();
    const toneSpy = jest.spyOn(audio, 'playTone').mockImplementation(() => undefined);

    for (let count = 0; count < 8; count += 1) {
      audio.playBgmTick('cave');
    }

    expect(toneSpy).toHaveBeenCalledWith(165, 0.08, 'sine', 0.02);
    expect(toneSpy).toHaveBeenCalledWith(82, 0.2, 'triangle', 0.02);
    toneSpy.mockRestore();
  });

  it('victory 時は BGM tick を再生しない', () => {
    const audio = new KeysAndArmsAudio();
    const toneSpy = jest.spyOn(audio, 'playTone').mockImplementation(() => undefined);

    audio.playBgmTick('boss', true);

    expect(toneSpy).not.toHaveBeenCalled();
    toneSpy.mockRestore();
  });
});
