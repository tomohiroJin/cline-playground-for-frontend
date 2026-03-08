/**
 * イベントコスト表示のヘルパー
 */
import type { EventCost } from '../../../types';

/** コスト情報をテキストに付記する（純粋関数） */
export function withCostText(text: string, cost: EventCost): string {
  if (cost.type === 'hp_damage') return `${text} (HP -${cost.amount})`;
  if (cost.type === 'bone') return `${text} (骨 -${cost.amount})`;
  return text;
}

/**
 * コスト情報を結果オブジェクトに付記する
 * @deprecated withCostText を使用してください
 */
export function appendCostText(base: { text: string }, cost: EventCost): void {
  base.text = withCostText(base.text, cost);
}
