/**
 * プレイヤー状態の事前条件
 *
 * ドメインサービスの入口でプレイヤーの状態が有効であることを検証する。
 */
import type { PlayerState } from '../types';
import { invariant } from '../contracts';

/** プレイヤー状態の事前条件を検証する */
export function requireValidPlayer(p: PlayerState): void {
  invariant(p.hp >= 0, `HP が負の値: ${p.hp}`);
  invariant(p.mhp > 0, `最大HPが0以下: ${p.mhp}`);
  invariant(p.atk >= 0, `ATKが負の値: ${p.atk}`);
  invariant(p.def >= 0, `DEFが負の値: ${p.def}`);
}
