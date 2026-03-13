import { createNullAudioService } from '../../infrastructure/null-audio-service';
import type { AudioModule } from '../../types/audio';

describe('NullAudioService', () => {
  let audio: AudioModule;

  it('生成できる', () => {
    audio = createNullAudioService();
    expect(audio).toBeDefined();
  });

  it('ea() がエラーなく呼べる', () => {
    audio = createNullAudioService();
    expect(() => audio.ea()).not.toThrow();
  });

  it('tn() がエラーなく呼べる', () => {
    audio = createNullAudioService();
    expect(() => audio.tn(440, 0.1)).not.toThrow();
  });

  it('noise() がエラーなく呼べる', () => {
    audio = createNullAudioService();
    expect(() => audio.noise(0.1)).not.toThrow();
  });

  it('bgmTick() がエラーなく呼べる', () => {
    audio = createNullAudioService();
    expect(() => audio.bgmTick()).not.toThrow();
  });

  it('全 SoundEffects メソッドがエラーなく呼べる', () => {
    audio = createNullAudioService();
    const { S } = audio;

    expect(() => S.tick()).not.toThrow();
    expect(() => S.move()).not.toThrow();
    expect(() => S.grab()).not.toThrow();
    expect(() => S.hit()).not.toThrow();
    expect(() => S.kill()).not.toThrow();
    expect(() => S.pry()).not.toThrow();
    expect(() => S.guard()).not.toThrow();
    expect(() => S.clear()).not.toThrow();
    expect(() => S.over()).not.toThrow();
    expect(() => S.start()).not.toThrow();
    expect(() => S.warn()).not.toThrow();
    expect(() => S.steal()).not.toThrow();
    expect(() => S.shieldBreak()).not.toThrow();
    expect(() => S.gem()).not.toThrow();
    expect(() => S.zap()).not.toThrow();
    expect(() => S.set()).not.toThrow();
    expect(() => S.step()).not.toThrow();
    expect(() => S.ladder()).not.toThrow();
    expect(() => S.safe()).not.toThrow();
    expect(() => S.drip()).not.toThrow();
    expect(() => S.combo(3)).not.toThrow();
    expect(() => S.bossDie()).not.toThrow();
  });

  it('SoundEffects の未定義プロパティアクセスも関数を返す', () => {
    audio = createNullAudioService();
    // Proxy による自動 noop: 将来追加されるメソッドにも対応
    const S = audio.S as unknown as Record<string, unknown>;
    expect(typeof S['futureMethod']).toBe('function');
    expect(() => (S['futureMethod'] as () => void)()).not.toThrow();
  });

  it('AudioModule のトップレベルメソッドも Proxy で noop を返す', () => {
    audio = createNullAudioService();
    const a = audio as unknown as Record<string, unknown>;
    expect(typeof a['futureTopLevel']).toBe('function');
    expect(() => (a['futureTopLevel'] as () => void)()).not.toThrow();
  });
});
