import { accumulateLook, LOOK_SENSITIVITY } from '../use-pointer-look';

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
