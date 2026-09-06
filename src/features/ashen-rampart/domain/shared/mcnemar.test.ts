import { mcnemarExactP } from './mcnemar';

describe('mcnemarExactP（McNemar 正確検定の両側 p 値）', () => {
  it('不一致が無ければ 1（差の証拠が無い）', () => {
    expect(mcnemarExactP(0, 0)).toBe(1);
  });

  it('完全に対称なら 1', () => {
    expect(mcnemarExactP(5, 5)).toBe(1);
  });

  it('b と c を入れ替えても同じ（対称性）', () => {
    expect(mcnemarExactP(3, 12)).toBeCloseTo(mcnemarExactP(12, 3), 12);
  });

  it('n=10 で 9対1 は 二項検定の既知値 0.021484375', () => {
    // 2 * P(X <= 1) = 2 * (C(10,0) + C(10,1)) / 2^10 = 2 * 11/1024
    expect(mcnemarExactP(9, 1)).toBeCloseTo(0.021484375, 12);
  });

  it('n=10 で 8対2 は 0.109375', () => {
    // 2 * (C(10,0)+C(10,1)+C(10,2)) / 2^10 = 2 * 56/1024
    expect(mcnemarExactP(8, 2)).toBeCloseTo(0.109375, 12);
  });

  it('n=6 で 6対0 は 0.03125', () => {
    // 2 * C(6,0)/2^6 = 2/64
    expect(mcnemarExactP(6, 0)).toBeCloseTo(0.03125, 12);
  });

  it('1 を超えない（打ち切り）', () => {
    for (let n = 0; n <= 40; n++) {
      for (let b = 0; b <= n; b++) {
        expect(mcnemarExactP(b, n - b)).toBeLessThanOrEqual(1);
        expect(mcnemarExactP(b, n - b)).toBeGreaterThan(0);
      }
    }
  });

  it('不一致数が大きくても桁あふれしない（b+c = 500）', () => {
    // 対数空間で計算していないと 2^500 で破綻する
    const p = mcnemarExactP(280, 220);
    expect(Number.isFinite(p)).toBe(true);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('不一致数が大きいときの既知値（b+c=100, 60対40）', () => {
    // ブリーフ記載の期待値 0.0568893 は手計算の誤り（桁の欠落）だったため、
    // Python の math.comb による完全精度計算で実測し直した値を採用する。
    // python3 -c "from math import comb; n=100
    //   print(2*sum(comb(n,k) for k in range(41))/2**n)"
    // => 0.05688793364098079
    expect(mcnemarExactP(60, 40)).toBeCloseTo(0.05688793364098079, 12);
  });

  it('負の入力は契約違反', () => {
    expect(() => mcnemarExactP(-1, 3)).toThrow('不一致ペア数は0以上の整数です');
  });

  it('非整数は契約違反', () => {
    expect(() => mcnemarExactP(1.5, 3)).toThrow('不一致ペア数は0以上の整数です');
  });
});
