/**
 * 灰燼の城壁 - 敵マーカーのスタック集約（純粋）
 *
 * 群れ20体は経路の7.2セル分を埋めるため、個別に描くとマーカーが重なり
 * HPバーが読めない（設計書 §9.3）。表示上だけ束ねる措置であり、
 * ドメインの敵は個体のまま扱う。
 */
import type { CellPos } from '../domain/board/stage-map';
import type { ActiveEnemy } from '../domain/combat/combat-state';
import { positionOf } from '../domain/combat/step-tick';

/** 同一マーカーに束ねる距離のしきい値（セル） */
const STACK_DISTANCE = 0.5;

export interface EnemyStack {
  /** 代表個体の id。React の key に使う */
  id: number;
  enemyId: string;
  /** 束ねた体数 */
  count: number;
  hp: number;
  maxHp: number;
  pos: CellPos;
}

export const stackEnemies = (
  enemies: readonly ActiveEnemy[],
  path: readonly CellPos[]
): EnemyStack[] => {
  const stacks: EnemyStack[] = [];
  enemies
    .filter((e) => e.alive)
    .forEach((enemy) => {
      const pos = positionOf(enemy.progress, path);
      const target = stacks.find(
        (s) =>
          s.enemyId === enemy.enemyId &&
          Math.hypot(s.pos.x - pos.x, s.pos.y - pos.y) <= STACK_DISTANCE
      );
      if (target) {
        target.count += 1;
        target.hp += enemy.hp;
        target.maxHp += enemy.maxHp;
        return;
      }
      stacks.push({
        id: enemy.id,
        enemyId: enemy.enemyId,
        count: 1,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        pos,
      });
    });
  return stacks;
};
