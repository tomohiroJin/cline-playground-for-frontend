/**
 * 灰燼の城壁 - ライフが減った理由の判定（純粋）
 *
 * ライフは漏れ（敵の砦到達）と溢れ（手札の上限超過）の両方で減るようになったため、
 * 内訳が読めないと「何をしたら減ったのか」が分からなくなる（反復5・設計書 §5.4）。
 * 直前 tick の `state.events` だけを見て理由を導く純粋関数にすることで、
 * `useAshenRampartGame` 側で複数 tick 保持する処理からも、テストからも扱いやすくする。
 */
import type { TickEvent } from '../domain/combat/combat-state';

/** その tick に起きたイベントから、ライフが減った理由の文言を導く。両方無ければ undefined */
export const lifeLossReason = (events: readonly TickEvent[]): string | undefined => {
  const overflowed = events.some((e) => e.kind === 'overflow');
  const leaked = events.some((e) => e.kind === 'leak');
  if (overflowed && leaked) return '手札があふれ、敵が砦に到達しました';
  if (overflowed) return '手札があふれました';
  if (leaked) return '敵が砦に到達しました';
  return undefined;
};
