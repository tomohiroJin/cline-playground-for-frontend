/**
 * 灰燼の城壁 - 敵マーカーのスタック集約（純粋）
 *
 * 群れ20体は経路の7.2セル分を埋めるため、個別に描くとマーカーが重なり
 * HPバーが読めない（PoC 設計書 2026-07-29-ashen-rampart-realtime-deck-poc-design.md §9.3。
 * 反復5 の設計書には §9.3 が無い）。表示上だけ束ねる措置であり、
 * ドメインの敵は個体のまま扱う。
 *
 * **束ねるのは同種だけである（下の条件式）。** 異なる敵種が同一位置に来た場合の
 * マーカーの重なりは、この集約では原理的に救えない（EnemyMarker はオフセットを
 * 持たないため完全に重なる）。反復5 で北レーンの体数が倍増し、速い雑兵が
 * 遅い重装を追い抜く機会が増えているので、ウェーブ4 開始直後は目視確認が要る
 * （waves.ts の docstring 参照）。
 */
import type { CellPos, StageMap } from '../domain/board/stage-map';
import type { ActiveEnemy } from '../domain/combat/combat-state';
import { enemyPosition } from '../domain/combat/step-tick';

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

/**
 * 敵は自身の laneIndex を持つため、レーンごとに座標を解決する
 * （単一レーンの配列を共有して渡すと、南レーンの敵が北レーンの座標に
 * 束ねられてしまう）。
 */
export const stackEnemies = (
  enemies: readonly ActiveEnemy[],
  map: StageMap
): EnemyStack[] => {
  const stacks: EnemyStack[] = [];
  enemies
    .filter((e) => e.alive)
    .forEach((enemy) => {
      const pos = enemyPosition(map, enemy);
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
