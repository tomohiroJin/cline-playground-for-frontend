// シード付き擬似乱数生成器（mulberry32 ベース）

/**
 * mulberry32 ベースのシード付き擬似乱数生成器。
 * 既存 Rand と同一 API を持ち、シード値から決定論的な乱数列を生成する。
 */
export class SeededRand {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** 0〜1 の浮動小数点乱数 */
  private next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** 0〜1 の浮動小数点乱数（wPick 用の公開メソッド） */
  random(): number {
    return this.next();
  }

  /** 0以上n未満のランダム整数 */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** 配列からランダムに1要素を選択 */
  pick<T>(a: readonly T[]): T {
    if (a.length === 0) throw new Error('SeededRand.pick: empty');
    return a[this.int(a.length)];
  }

  /** 確率pでtrueを返す */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** 配列をシャッフルした新しい配列を返す */
  shuffle<T>(a: readonly T[]): T[] {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }
}

/**
 * 日次IDから数値シードを生成（FNV-1a ハッシュ）
 */
export function dateToSeed(dateStr: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < dateStr.length; i++) {
    hash ^= dateStr.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0; // 符号なし32bit
}

/**
 * 現在日付から日次IDを生成（YYYY-MM-DD 形式）
 */
export function getDailyId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
