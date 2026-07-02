/**
 * 方向性シェイク計算のテスト
 */
import { computeShakeOffset } from './shake';

describe('computeShakeOffset', () => {
  it('強度0では動かない', () => {
    expect(computeShakeOffset(0, 50)).toEqual({ x: 0, y: 0 });
  });

  it('決定論的（同じ入力で同じ出力）', () => {
    const a = computeShakeOffset(4, 33);
    const b = computeShakeOffset(4, 33);
    expect(a).toEqual(b);
  });

  it('方向なしでも両軸に振動する（経過時間で変化）', () => {
    const t1 = computeShakeOffset(4, 10);
    const t2 = computeShakeOffset(4, 60);
    expect(t1).not.toEqual(t2);
    expect(Math.abs(t1.x)).toBeLessThanOrEqual(4);
    expect(Math.abs(t1.y)).toBeLessThanOrEqual(4);
  });

  it('水平方向指定時は主振動が X 軸に乗る', () => {
    // 複数時点で X 振幅の最大値が Y 振幅の最大値を上回ることを確認
    let maxX = 0;
    let maxY = 0;
    for (let t = 0; t <= 200; t += 10) {
      const o = computeShakeOffset(4, t, { x: 1, y: 0 });
      maxX = Math.max(maxX, Math.abs(o.x));
      maxY = Math.max(maxY, Math.abs(o.y));
    }
    expect(maxX).toBeGreaterThan(maxY);
  });

  it('ゼロベクトル方向は方向なしと同じ挙動にフォールバックする', () => {
    expect(computeShakeOffset(4, 50, { x: 0, y: 0 })).toEqual(computeShakeOffset(4, 50));
  });
});
