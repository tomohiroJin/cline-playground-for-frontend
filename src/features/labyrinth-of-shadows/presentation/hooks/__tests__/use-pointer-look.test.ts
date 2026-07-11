import { accumulateLook, clampPitch, LOOK_SENSITIVITY, MAX_PITCH } from '../use-pointer-look';

describe('accumulateLook', () => {
  test('マウス移動量に感度を掛けて加算する', () => {
    const next = accumulateLook(0, 100);
    expect(next).toBeCloseTo(100 * LOOK_SENSITIVITY);
  });

  test('既存の蓄積値に加算される', () => {
    const first = accumulateLook(0, 50);
    const second = accumulateLook(first, 50);
    expect(second).toBeCloseTo(100 * LOOK_SENSITIVITY);
  });

  test('負の移動量は逆方向に加算', () => {
    expect(accumulateLook(0, -30)).toBeCloseTo(-30 * LOOK_SENSITIVITY);
  });
});

describe('clampPitch', () => {
  test('範囲内の値はそのまま返る', () => {
    expect(clampPitch(0.1)).toBeCloseTo(0.1);
  });

  test('上限を超えると MAX_PITCH に制限される', () => {
    expect(clampPitch(10)).toBeCloseTo(MAX_PITCH);
  });

  test('下限を下回ると -MAX_PITCH に制限される', () => {
    expect(clampPitch(-10)).toBeCloseTo(-MAX_PITCH);
  });
});
