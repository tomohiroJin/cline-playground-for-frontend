/**
 * 灰燼の城壁 - そのセルにいる敵の種類（反復7 段階2・設計書 §4.3 #4）
 *
 * 札を選んでいないときに敵のいる経路セルをタップすると、その敵の種類の能力表示を開く。
 * どの敵を開くかを決定的にするため、次の2つを固定する:
 * - 「そのセルにいる」＝マーカーの中心が入っているセル。EnemyMarker は中心を (pos + 0.5) に
 *   描くので、`Math.round(pos)` が見えている位置のセルになる
 * - 複数いるときは state.enemies の並び（出現順）で最初の生存個体。束ねたマーカーの
 *   代表個体（enemy-stack.ts）と同じく「先に出た方」
 */
import type { CellPos, StageMap } from '../domain/board/stage-map';
import type { ActiveEnemy } from '../domain/combat/combat-state';
import { enemyPosition } from '../domain/combat/enemy-position';

export const enemyIdAtCell = (
  enemies: readonly ActiveEnemy[],
  map: StageMap,
  pos: CellPos
): string | undefined =>
  enemies.find((enemy) => {
    if (!enemy.alive) return false;
    const at = enemyPosition(map, enemy);
    return Math.round(at.x) === pos.x && Math.round(at.y) === pos.y;
  })?.enemyId;
