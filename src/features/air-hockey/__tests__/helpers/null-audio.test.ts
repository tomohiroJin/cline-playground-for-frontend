/**
 * NullAudioAdapter テスト
 * - 呼び出し記録が正しく動作すること
 * - AudioPort インターフェースを満たすこと
 */
import { NullAudioAdapter } from './null-audio';
import type { AudioPort } from '../../domain/contracts/audio';

describe('NullAudioAdapter', () => {
  let audio: NullAudioAdapter;

  beforeEach(() => {
    audio = new NullAudioAdapter();
  });

  it('AudioPort インターフェースを満たす', () => {
    // 型チェック: NullAudioAdapter は AudioPort として使用可能
    const port: AudioPort = audio;
    expect(port).toBeDefined();
  });

  it('効果音メソッド呼び出しを記録する', () => {
    audio.playHit(5);
    audio.playWall(0.5);
    audio.playGoal();
    audio.playItem();

    expect(audio.calls).toHaveLength(4);
    expect(audio.calls[0]).toEqual({ method: 'playHit', args: [5] });
    expect(audio.calls[1]).toEqual({ method: 'playWall', args: [0.5] });
    expect(audio.calls[2]).toEqual({ method: 'playGoal', args: [] });
    expect(audio.calls[3]).toEqual({ method: 'playItem', args: [] });
  });

  it('BGM メソッド呼び出しを記録する', () => {
    audio.startBgm();
    audio.setBgmTempo(1.5);
    audio.stopBgm();

    expect(audio.getCallCount('startBgm')).toBe(1);
    expect(audio.getCallCount('setBgmTempo')).toBe(1);
    expect(audio.getCallCount('stopBgm')).toBe(1);
  });

  it('設定メソッド呼び出しを記録する', () => {
    audio.setBgmVolume(80);
    audio.setSeVolume(30);
    audio.setMuted(true);

    expect(audio.calls).toEqual([
      { method: 'setBgmVolume', args: [80] },
      { method: 'setSeVolume', args: [30] },
      { method: 'setMuted', args: [true] },
    ]);
  });

  it('clear で呼び出し記録をリセットできる', () => {
    audio.playHit(10);
    audio.playGoal();
    expect(audio.calls).toHaveLength(2);

    audio.clear();
    expect(audio.calls).toHaveLength(0);
  });

  it('getCallCount で特定メソッドの呼び出し回数を取得できる', () => {
    audio.playHit(1);
    audio.playHit(2);
    audio.playHit(3);
    audio.playGoal();

    expect(audio.getCallCount('playHit')).toBe(3);
    expect(audio.getCallCount('playGoal')).toBe(1);
    expect(audio.getCallCount('playWall')).toBe(0);
  });
});
