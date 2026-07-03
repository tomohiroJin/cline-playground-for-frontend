import {
  selectWalkFrameIndex,
  computeWalkBob,
  computeSquash,
  computeAttackTransform,
  selectProgressFrameIndex,
  computeAttackProgress,
  WALK_BOB_AMPLITUDE,
} from './motion';

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
  it('は常に (1 - SQUASH_DEPTH) 以上 1.0 以下', () => {
    for (let t = 0; t < 200; t += 7) {
      const s = computeSquash(t, fd);
      expect(s).toBeGreaterThanOrEqual(1 - 0.06 - 1e-9);
      expect(s).toBeLessThanOrEqual(1);
    }
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

describe('computeAttackProgress', () => {
  it('は攻撃開始の瞬間（now = until - durationMs）に 0 を返す', () => {
    expect(computeAttackProgress(1000, 1300, 300)).toBeCloseTo(0);
  });
  it('は中間地点で 0.5 を返す', () => {
    expect(computeAttackProgress(1150, 1300, 300)).toBeCloseTo(0.5);
  });
  it('は until を過ぎたら 1 を返す', () => {
    expect(computeAttackProgress(1400, 1300, 300)).toBeCloseTo(1);
  });
  it('は開始前（now が開始時刻未満）は 0 にクランプする', () => {
    expect(computeAttackProgress(900, 1300, 300)).toBe(0);
  });
});

describe('selectProgressFrameIndex', () => {
  it('進行度 0 で最初のフレーム、1 直前で最後のフレームを返す', () => {
    expect(selectProgressFrameIndex(0, 4)).toBe(0);
    expect(selectProgressFrameIndex(0.99, 4)).toBe(3);
  });

  it('進行度に応じて均等にフレームが切り替わる', () => {
    expect(selectProgressFrameIndex(0.2, 4)).toBe(0);
    expect(selectProgressFrameIndex(0.3, 4)).toBe(1);
    expect(selectProgressFrameIndex(0.6, 4)).toBe(2);
    expect(selectProgressFrameIndex(0.8, 4)).toBe(3);
  });

  it('範囲外はクランプする（1 以上でも最終フレーム）', () => {
    expect(selectProgressFrameIndex(-0.5, 4)).toBe(0);
    expect(selectProgressFrameIndex(1, 4)).toBe(3);
    expect(selectProgressFrameIndex(1.5, 4)).toBe(3);
  });
});
