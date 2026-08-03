/**
 * 灰燼の城壁 - 敵の状態判定（純粋）
 *
 * 飛行判定は射撃・範囲巻き込み・罠・業火の4経路から呼ばれる。
 * 以前は各経路が getEnemySpec(...).flying を直接見ていたため、
 * 地上化（落網）のような状態を足すと1箇所でも漏れれば矛盾が起きた。
 * 判定をこの関数に集約し、ここを唯一の真実にする。
 */
import type { ActiveEnemy } from './combat-state';
import { getEnemySpec } from './enemies';

/**
 * その tick 時点で敵が飛行しているか
 *
 * 地上化中（groundedUntilTick 以下）は飛行敵も地上として扱う。
 * 地上の敵に地上化が掛かっても意味を持たない。
 */
export const isEnemyFlying = (enemy: ActiveEnemy, tick: number): boolean =>
  getEnemySpec(enemy.enemyId).flying && tick > enemy.groundedUntilTick;
