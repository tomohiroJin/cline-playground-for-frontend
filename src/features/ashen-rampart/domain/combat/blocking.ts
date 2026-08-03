/**
 * 灰燼の城壁 - ブロック判定
 *
 * 地上の敵は、次に進入する経路セルに守り手がいればそのセルに進入せず止まる。
 * 足元のセルに守り手が後から置かれた場合も止まる（置いた瞬間に塞げる）。
 *
 * 契約: 飛行はこの判定を通らない。ただし落網で地上化している間は通る
 * （判定の呼び出し側で除外する。ここでは飛行かどうかを見ない）。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { laneOf } from '../board/stage-map';
import type { ActiveEnemy, PlacedUnit } from './combat-state';

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** ブロック判定に必要な文脈。tick は Task 6 の地上化判定で使う */
export interface BlockContext {
  units: readonly PlacedUnit[];
  map: StageMap;
  tick: number;
}

/**
 * その敵を止めている守り手の index
 *
 * 「足元」と「次のセル」の両方を見るのは、既に進入済みのセルに守り手を
 * 置かれた場合にすり抜けさせないため。`Math.floor` の切り捨てにより、
 * progress 2.0 も 2.7 も足元はセル2 になる。
 */
export const blockerIndexFor = (
  ctx: BlockContext,
  enemy: ActiveEnemy
): number | undefined => {
  const { units, map } = ctx;
  if (!enemy.alive) return undefined;
  const lane = laneOf(map, enemy.laneIndex);
  if (lane.length === 0) return undefined;
  const hereIndex = Math.min(Math.floor(enemy.progress), lane.length - 1);
  const here = lane[hereIndex];
  const next = lane[hereIndex + 1];
  const found = [here, next].reduce<number | undefined>((acc, cell) => {
    if (acc !== undefined || !cell) return acc;
    const index = units.findIndex((u) => samePos(u.pos, cell));
    return index >= 0 ? index : undefined;
  }, undefined);
  return found;
};

/** その敵が止められているか */
export const isBlocked = (ctx: BlockContext, enemy: ActiveEnemy): boolean =>
  blockerIndexFor(ctx, enemy) !== undefined;

/**
 * 1体のブロッカーを同時に殴れる敵の数
 *
 * 群れ22体が同時に殴ると、石壁HP60 は 41tick で溶ける
 * （22 × 1ダメージ / 15tick = 1.47 dps）。上限3 で約300tick 保つ。
 *
 * 副次的に、待たされた敵が経路上に詰まるため範囲攻撃が刺さるようになる。
 */
export const MAX_ATTACKERS_PER_BLOCKER = 3;

/** その守り手を殴っている敵（進行度の高い順に上限まで） */
export const attackersFor = (
  ctx: BlockContext,
  enemies: readonly ActiveEnemy[],
  unitIndex: number
): ActiveEnemy[] =>
  enemies
    .filter((e) => blockerIndexFor(ctx, e) === unitIndex)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, MAX_ATTACKERS_PER_BLOCKER);
