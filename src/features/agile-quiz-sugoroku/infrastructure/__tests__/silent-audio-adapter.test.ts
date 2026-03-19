/**
 * SilentAudioAdapter テスト
 *
 * テスト用の無音アダプターが AudioPort を正しく実装していることを検証する。
 */
import { SilentAudioAdapter } from '../audio/silent-audio-adapter';

describe('SilentAudioAdapter', () => {
  let audio: SilentAudioAdapter;

  beforeEach(() => {
    audio = new SilentAudioAdapter();
  });

  it('全メソッドがエラーなく呼び出せる', () => {
    // AudioPort の全メソッドが例外を投げないことを確認
    expect(() => audio.initialize()).not.toThrow();
    expect(() => audio.playBgm()).not.toThrow();
    expect(() => audio.stopBgm()).not.toThrow();
    expect(() => audio.playSfxCorrect()).not.toThrow();
    expect(() => audio.playSfxIncorrect()).not.toThrow();
    expect(() => audio.playSfxTick()).not.toThrow();
    expect(() => audio.playSfxTickUrgent(3)).not.toThrow();
    expect(() => audio.playSfxCombo()).not.toThrow();
    expect(() => audio.playSfxComboBreak()).not.toThrow();
    expect(() => audio.playSfxDrumroll()).not.toThrow();
    expect(() => audio.playSfxFanfare()).not.toThrow();
    expect(() => audio.playSfxAchievement()).not.toThrow();
    expect(() => audio.playSfxStart()).not.toThrow();
    expect(() => audio.playSfxResult()).not.toThrow();
  });
});
