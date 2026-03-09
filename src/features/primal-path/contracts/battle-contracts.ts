/**
 * バトル状態の事前条件
 *
 * 戦闘操作の入口でバトル状態が有効であることを検証する。
 */
import type { BattleState } from '../types';
import { invariant } from '../contracts';

/** アクティブなバトルの事前条件を検証する */
export function requireActiveBattle(b: BattleState): void {
  invariant(b.en !== null, '敵が存在しない状態で戦闘操作');
  invariant(b.turn >= 0, `ターン数が負: ${b.turn}`);
}
