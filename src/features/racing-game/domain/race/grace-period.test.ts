// grace-period のテスト

import {
  graceSpeedMultiplier,
  isGraceExpired,
  GRACE_DURATION_SEC,
} from './grace-period';

describe('graceSpeedMultiplier', () => {
  it('開始時は 1.0', () => {
    expect(graceSpeedMultiplier(0)).toBe(1);
  });

  it('中央時点で 0.5', () => {
    expect(graceSpeedMultiplier(GRACE_DURATION_SEC / 2)).toBeCloseTo(0.5);
  });

  it('期限ぴったりで 0', () => {
    expect(graceSpeedMultiplier(GRACE_DURATION_SEC)).toBe(0);
  });

  it('期限を過ぎても 0 でクランプ', () => {
    expect(graceSpeedMultiplier(GRACE_DURATION_SEC + 1)).toBe(0);
  });

  it('負値はアサーションで弾く', () => {
    expect(() => graceSpeedMultiplier(-0.1)).toThrow();
  });
});

describe('isGraceExpired', () => {
  it('GRACE_DURATION_SEC 未満は false', () => {
    expect(isGraceExpired(0)).toBe(false);
    expect(isGraceExpired(GRACE_DURATION_SEC - 0.001)).toBe(false);
  });

  it('GRACE_DURATION_SEC 以上は true', () => {
    expect(isGraceExpired(GRACE_DURATION_SEC)).toBe(true);
    expect(isGraceExpired(GRACE_DURATION_SEC + 1)).toBe(true);
  });
});
