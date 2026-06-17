import { selectWalkFrameIndex } from './motion';

describe('selectWalkFrameIndex', () => {
  // 4枚循環 [walk1, mid, walk2, mid] = [1, 2, 3, 2] で walk2(=3) を必ず含む
  it('は now の進行に応じて [1,2,3,2] を循環する', () => {
    const fd = 100;
    expect(selectWalkFrameIndex(0, fd)).toBe(1);
    expect(selectWalkFrameIndex(100, fd)).toBe(2);
    expect(selectWalkFrameIndex(200, fd)).toBe(3);
    expect(selectWalkFrameIndex(300, fd)).toBe(2);
    expect(selectWalkFrameIndex(400, fd)).toBe(1); // 一巡して戻る
  });

  it('は死蔵フレーム walk2(=3) を循環内に含む', () => {
    const fd = 100;
    const seen = [0, 1, 2, 3].map((i) => selectWalkFrameIndex(i * fd, fd));
    expect(seen).toContain(3);
  });
});

import {
  computeWalkBob,
  computeSquash,
  computeAttackTransform,
  WALK_BOB_AMPLITUDE,
} from './motion';

describe('computeWalkBob', () => {
  const fd = 100;
  it('は接地（sin=0）で 0、半周期（sin=1）で振幅最大になる', () => {
    expect(computeWalkBob(0, fd)).toBeCloseTo(0);
    expect(computeWalkBob(50, fd)).toBeCloseTo(WALK_BOB_AMPLITUDE); // sin(pi/2)=1
  });
  it('は常に 0 以上 振幅以下', () => {
    for (let t = 0; t < 200; t += 7) {
      const b = computeWalkBob(t, fd);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(WALK_BOB_AMPLITUDE + 1e-9);
    }
  });
});

describe('computeSquash', () => {
  const fd = 100;
  it('は接地（sin=0）で最も縮み、空中（sin=1）で 1.0', () => {
    expect(computeSquash(0, fd)).toBeLessThan(1);
    expect(computeSquash(50, fd)).toBeCloseTo(1);
  });
});

describe('computeAttackTransform', () => {
  it('は予備動作で進行方向の逆へ引く（down は dy<0）', () => {
    const tf = computeAttackTransform(0.1, 'down');
    expect(tf.dy).toBeLessThan(0);
    expect(tf.scale).toBeCloseTo(1);
  });
  it('は踏み込みで進行方向へ前進し拡大する（right は dx>0, scale>1）', () => {
    const tf = computeAttackTransform(0.35, 'right');
    expect(tf.dx).toBeGreaterThan(0);
    expect(tf.scale).toBeGreaterThan(1);
  });
  it('は終了時（progress=1）に原点・等倍へ戻る', () => {
    const tf = computeAttackTransform(1, 'up');
    expect(tf.dx).toBeCloseTo(0);
    expect(tf.dy).toBeCloseTo(0);
    expect(tf.scale).toBeCloseTo(1);
  });
  it('は範囲外 progress をクランプする', () => {
    expect(computeAttackTransform(-5, 'left')).toEqual(computeAttackTransform(0, 'left'));
    expect(computeAttackTransform(5, 'left')).toEqual(computeAttackTransform(1, 'left'));
  });
});
