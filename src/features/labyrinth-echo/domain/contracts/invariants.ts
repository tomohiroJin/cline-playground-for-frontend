/**
 * 迷宮の残響 - Design-by-Contract アサーション
 *
 * ドメイン層の不変条件・事前条件・事後条件を検証する。
 */

/** Design-by-Contract アサーション — 条件違反時に例外をスローする */
export function invariant(cond: unknown, ctx: string, detail = ""): asserts cond {
  if (!cond) {
    const msg = `[迷宮の残響] Invariant violation in ${ctx}${detail ? `: ${detail}` : ""}`;
    console.error(msg);
    throw new Error(msg);
  }
}
