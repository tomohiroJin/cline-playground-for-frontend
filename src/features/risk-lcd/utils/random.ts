// 乱数ユーティリティ
export const Rand = Object.freeze({
  /** 0以上n未満のランダム整数 */
  int: (n: number): number => Math.floor(Math.random() * n),

  /** 配列からランダムに1要素を選択 */
  pick: <T>(a: readonly T[]): T => {
    if (a.length === 0) throw new Error('Rand.pick: empty');
    return a[Rand.int(a.length)];
  },

  /** 確率pでtrueを返す */
  chance: (p: number): boolean => Math.random() < p,

  /** 配列をシャッフルした新しい配列を返す */
  shuffle: <T>(a: readonly T[]): T[] => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Rand.int(i + 1);
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  },
});
