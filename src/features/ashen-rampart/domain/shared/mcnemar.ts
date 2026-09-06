/**
 * 灰燼の城壁 - McNemar 正確検定（反復6・設計書 §8.2.6(d)）
 *
 * 対応のある2条件の比較で使う。段階A の測定は総数の比較しかしておらず、
 * 「17対17 だから同着＝効果なし」という誤読を生んだ。実際には4件ずつの
 * 入れ替わりが相殺していただけで、標本を増やすと非対称になった（§8.2.4(b)）。
 * **総数ではなく分割表（b, c）で判定するための道具である。**
 *
 * 帰無仮説は「不一致ペアは対称」。`X ~ Binomial(b + c, 0.5)` の両側正確 p 値を返す。
 *
 * `2^n` を直接扱わない。`b + c` は500 に達しうるので対数空間で足す。
 */

/** 対数ガンマ関数（Lanczos 近似）。二項係数を対数で扱うために使う */
const logGamma = (x: number): number => {
  const g = 7;
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const z = x - 1;
  let a = coefficients[0] ?? 0;
  const t = z + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += (coefficients[i] ?? 0) / (z + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
};

/** log C(n, k) */
const logBinomialCoefficient = (n: number, k: number): number =>
  logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);

/**
 * McNemar 正確検定の両側 p 値
 *
 * @param b 一方の条件だけで成功した組の数
 * @param c もう一方の条件だけで成功した組の数
 */
export const mcnemarExactP = (b: number, c: number): number => {
  if (!Number.isInteger(b) || !Number.isInteger(c) || b < 0 || c < 0) {
    throw new Error('不一致ペア数は0以上の整数です');
  }
  const n = b + c;
  if (n === 0) return 1;

  // 小さいほうの裾を対数空間で足す
  const lower = Math.min(b, c);
  const logHalfPowN = -n * Math.LN2;
  let tail = 0;
  for (let k = 0; k <= lower; k++) {
    tail += Math.exp(logBinomialCoefficient(n, k) + logHalfPowN);
  }
  return Math.min(1, 2 * tail);
};
