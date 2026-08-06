/**
 * 灰燼の城壁 - 敵の盤面座標
 *
 * 進行度（レーン上の位置）から実座標への変換だけを持つ。
 * step-tick.ts から切り出したのは、blocking.ts が射程判定で座標を必要とし、
 * step-tick.ts → blocking.ts の import 方向と衝突するため（反復5 Task 2）。
 * 依存は stage-map と combat-state の型のみで、戦闘の手順を一切知らない。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { laneOf } from '../board/stage-map';
import type { ActiveEnemy } from './combat-state';

/** 進行度から補間済みの盤面座標を求める */
export const positionOf = (progress: number, path: readonly CellPos[]): CellPos => {
  if (path.length === 0) return { x: 0, y: 0 };
  const last = path.length - 1;
  const clamped = Math.max(0, Math.min(progress, last));
  const i = Math.min(Math.floor(clamped), Math.max(0, last - 1));
  const a = path[i];
  const b = path[i + 1] ?? a;
  if (!a || !b) return { x: 0, y: 0 };
  const frac = clamped - i;
  return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
};

/** その敵の所属レーン */
export const laneFor = (map: StageMap, enemy: ActiveEnemy): readonly CellPos[] =>
  laneOf(map, enemy.laneIndex);

/** その敵が砦に到達したとみなす進行度 */
export const goalFor = (map: StageMap, enemy: ActiveEnemy): number =>
  Math.max(0, laneFor(map, enemy).length - 1);

/** その敵の現在の盤面座標 */
export const enemyPosition = (map: StageMap, enemy: ActiveEnemy): CellPos =>
  positionOf(enemy.progress, laneFor(map, enemy));
