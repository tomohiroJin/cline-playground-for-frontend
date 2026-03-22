import { createNullAudioAdapter } from '../../../infrastructure/audio/null-audio-adapter';
import { AudioPort } from '../../../infrastructure/audio/audio-port';

describe('createNullAudioAdapter', () => {
  let adapter: AudioPort;

  beforeEach(() => {
    adapter = createNullAudioAdapter();
  });

  it('AudioPort インターフェースの全メソッドを持つ', () => {
    expect(typeof adapter.init).toBe('function');
    expect(typeof adapter.play).toBe('function');
    expect(typeof adapter.playMelody).toBe('function');
    expect(typeof adapter.playCombo).toBe('function');
    expect(typeof adapter.startBGM).toBe('function');
    expect(typeof adapter.stopBGM).toBe('function');
    expect(typeof adapter.cleanup).toBe('function');
  });

  it('init を呼んでもエラーが発生しない', () => {
    expect(() => adapter.init()).not.toThrow();
  });

  it('play を呼んでもエラーが発生しない', () => {
    expect(() => adapter.play('jump')).not.toThrow();
  });

  it('playMelody を呼んでもエラーが発生しない', () => {
    expect(() => adapter.playMelody('clear')).not.toThrow();
  });

  it('playCombo を呼んでもエラーが発生しない', () => {
    expect(() => adapter.playCombo(3)).not.toThrow();
  });

  it('startBGM を呼んでもエラーが発生しない', () => {
    expect(() => adapter.startBGM()).not.toThrow();
  });

  it('stopBGM を呼んでもエラーが発生しない', () => {
    expect(() => adapter.stopBGM()).not.toThrow();
  });

  it('cleanup を呼んでもエラーが発生しない', () => {
    expect(() => adapter.cleanup()).not.toThrow();
  });

  it('各メソッドは undefined を返す', () => {
    expect(adapter.init()).toBeUndefined();
    expect(adapter.play('hit')).toBeUndefined();
    expect(adapter.playMelody('gameOver')).toBeUndefined();
    expect(adapter.playCombo(1)).toBeUndefined();
    expect(adapter.startBGM()).toBeUndefined();
    expect(adapter.stopBGM()).toBeUndefined();
    expect(adapter.cleanup()).toBeUndefined();
  });
});
