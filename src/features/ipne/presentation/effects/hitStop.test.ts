/**
 * ヒットストップマネージャーのテスト
 */
import { HitStopManager, HIT_STOP_DURATIONS } from './hitStop';

describe('HitStopManager', () => {
  it('トリガー前は now をそのまま返す', () => {
    const hs = new HitStopManager();
    expect(hs.resolveVisualNow(1000)).toBe(1000);
    expect(hs.isFrozen(1000)).toBe(false);
  });

  it('トリガー後の凍結中は凍結開始時刻を返す', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 70);
    expect(hs.isFrozen(1050)).toBe(true);
    expect(hs.resolveVisualNow(1050)).toBe(1000);
  });

  it('凍結終了後は now をそのまま返す', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 70);
    expect(hs.isFrozen(1070)).toBe(false);
    expect(hs.resolveVisualNow(1071)).toBe(1071);
  });

  it('凍結中の再トリガーは終了時刻を延長する（開始時刻は維持）', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 70);
    hs.trigger(1050, 70); // 1120 まで延長
    expect(hs.isFrozen(1100)).toBe(true);
    expect(hs.resolveVisualNow(1100)).toBe(1000);
    expect(hs.isFrozen(1120)).toBe(false);
  });

  it('短い再トリガーで終了時刻は縮まない', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 150);
    hs.trigger(1010, 10);
    expect(hs.isFrozen(1100)).toBe(true);
  });

  it('clear で凍結を解除する', () => {
    const hs = new HitStopManager();
    hs.trigger(1000, 150);
    hs.clear();
    expect(hs.isFrozen(1050)).toBe(false);
  });

  it('持続時間定数が仕様どおり', () => {
    expect(HIT_STOP_DURATIONS.attackHit).toBe(70);
    expect(HIT_STOP_DURATIONS.playerDamage).toBe(70);
    expect(HIT_STOP_DURATIONS.bossKill).toBe(150);
  });
});
