/**
 * 打撃反応（階調化）の純粋関数テスト
 */
import { computeImpact } from './impact';

describe('computeImpact', () => {
  it('下限速度未満なら null を返す（軽打では反応なし）', () => {
    expect(computeImpact(0)).toBeNull();
    expect(computeImpact(3.9)).toBeNull();
  });

  it('下限速度以上なら反応オブジェクトを返す', () => {
    const r = computeImpact(4);
    expect(r).not.toBeNull();
  });

  it('速度が上がるほど各反応量が単調非減少になる', () => {
    const mid = computeImpact(8);
    const high = computeImpact(14);
    expect(mid).not.toBeNull();
    expect(high).not.toBeNull();
    if (!mid || !high) return;
    expect(high.shakeIntensity).toBeGreaterThanOrEqual(mid.shakeIntensity);
    expect(high.shakeDuration).toBeGreaterThanOrEqual(mid.shakeDuration);
    expect(high.hitStopFrames).toBeGreaterThanOrEqual(mid.hitStopFrames);
    expect(high.shockwaveMaxRadius).toBeGreaterThanOrEqual(mid.shockwaveMaxRadius);
    expect(high.vibrationMs).toBeGreaterThanOrEqual(mid.vibrationMs);
  });

  it('最大速度を超えても値がクランプされる（頭打ち）', () => {
    const atMax = computeImpact(16);
    const beyond = computeImpact(100);
    expect(atMax).not.toBeNull();
    expect(beyond).not.toBeNull();
    if (!atMax || !beyond) return;
    expect(beyond.shakeIntensity).toBeCloseTo(atMax.shakeIntensity);
    expect(beyond.shockwaveMaxRadius).toBeCloseTo(atMax.shockwaveMaxRadius);
  });

  it('低速の打撃では hitStop フレームが 0 になる', () => {
    const low = computeImpact(4);
    expect(low).not.toBeNull();
    if (!low) return;
    expect(low.hitStopFrames).toBe(0);
  });

  it('強打では hitStop フレームが 1 以上になる', () => {
    const strong = computeImpact(16);
    expect(strong).not.toBeNull();
    if (!strong) return;
    expect(strong.hitStopFrames).toBeGreaterThanOrEqual(1);
  });
});
