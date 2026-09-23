/**
 * 灰燼の城壁 - Holm-Bonferroni の補正（設計書 §8.2.15(h)）
 *
 * 生 p 値を昇順に並べ、`i` 番目に `(m - i + 1)` を掛けたうえで単調化する。
 * 単調化しないと「小さい生 p の補正後が、大きい生 p の補正後を上回る」
 * 順序の逆転が起きる。
 *
 * **`G3` では、この補正が実際に判定を変えうる。** 合格条件（相対低下50%）と
 * 前提条文 `B0-P4`（基準勝率 ≥ 0.40）を満たす組の McNemar p 値の最大は 0.01349 で、
 * 5本族の最も厳しい2段階（α/5 = 0.01・α/4 = 0.0125）を超える。
 * 撤回された §8.2.14 の設計（最大 p が 7.85e-5）では、補正は構造的に空振りしていた。
 */
export const holmAdjust = (pValues: readonly number[]): number[] => {
  pValues.forEach((p) => {
    if (!Number.isFinite(p) || p < 0 || p > 1) {
      throw new Error(`p 値は 0 以上 1 以下です: ${p}`);
    }
  });

  const m = pValues.length;
  const order = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p);
  const adjusted = new Array<number>(m);
  let running = 0;
  order.forEach((entry, rank) => {
    running = Math.min(1, Math.max(running, entry.p * (m - rank)));
    adjusted[entry.index] = running;
  });
  return adjusted;
};
