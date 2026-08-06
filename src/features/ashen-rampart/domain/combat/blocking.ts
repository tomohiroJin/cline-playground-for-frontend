/**
 * 灰燼の城壁 - ブロック判定
 *
 * 地上の敵は、次に進入する経路セルに守り手がいればそのセルに進入せず止まる。
 * 足元のセルに守り手が後から置かれた場合も止まる（置いた瞬間に塞げる）。
 *
 * 契約: 飛行はこの判定を通らない。ただし落網で地上化している間は地上と
 * 同じ扱いになる（isEnemyFlying が地上化込みで判定するため、この関数自身が見る）。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { laneOf } from '../board/stage-map';
import type { ActiveEnemy, PlacedUnit } from './combat-state';
import { isEnemyFlying } from './enemy-status';
import { getEnemySpec } from './enemies';
import { enemyPosition } from './enemy-position';

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
  const { units, map, tick } = ctx;
  if (!enemy.alive) return undefined;
  // 飛行はブロックを無視する。ただし落網で地上化している間は地上の敵と同じ扱い
  // にする（isEnemyFlying が地上化を判定込みで返す）。素通りさせると
  // 「落として叩く」という落網の意図と食い違う。
  if (isEnemyFlying(enemy, tick)) return undefined;
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
 * その敵が今 tick に攻撃する守り手の index
 *
 * 契約（設計書 §4.1）:
 * 1. 自分をブロックしている守り手がいれば、それを攻撃する
 * 2. いなければ、射程内で最も近い守り手を攻撃する。同距離なら units の配列順
 *
 * **順序を逆にしてはいけない。** 壁を無視して奥の塔を撃つようになると石壁が
 * 機能を失い、反復3 で作った「経路上でブロックする」という中核が壊れる。
 *
 * 距離は敵の補間済み座標から守り手のセルまでのユークリッド距離で測り、
 * `<= attackRange` を射程内とする。守り手側の射程判定（hypot(...) <= range）と
 * 同じ式にそろえてある——反復4 では判定と描画が半セルずれる欠陥が出ている。
 *
 * 1体の敵が殴る守り手は1つだけ（範囲攻撃ではない）。
 */
export const attackTargetIndexFor = (
  ctx: BlockContext,
  enemy: ActiveEnemy
): number | undefined => {
  const blocker = blockerIndexFor(ctx, enemy);
  if (blocker !== undefined) return blocker;
  if (!enemy.alive) return undefined;
  // 飛行はブロックも射程攻撃もしない。地上化中は地上の敵と同じ扱い
  if (isEnemyFlying(enemy, ctx.tick)) return undefined;
  const range = getEnemySpec(enemy.enemyId).attackRange;
  if (range <= 0) return undefined;
  const pos = enemyPosition(ctx.map, enemy);
  const found = ctx.units.reduce<{ index: number; distance: number } | undefined>(
    (best, unit, index) => {
      const distance = Math.hypot(pos.x - unit.pos.x, pos.y - unit.pos.y);
      if (distance > range) return best;
      // 同距離は配列順（先勝ち）で決定的に選ぶ（<= ではなく < にすると同距離のとき後勝ちになる）
      if (best !== undefined && best.distance <= distance) return best;
      return { index, distance };
    },
    undefined
  );
  return found?.index;
};

/**
 * 1体の守り手を同時に殴れる敵の数
 *
 * 群れ22体が同時に殴ると、石壁HP60 は 41tick で溶ける
 * （22 × 1ダメージ / 15tick = 1.47 dps）。上限3 で約300tick 保つ。
 *
 * 副次的に、待たされた敵が経路上に詰まるため範囲攻撃が刺さるようになる。
 *
 * **反復5 で射程攻撃込みの上限になった**（旧名 MAX_ATTACKERS_PER_BLOCKER）。
 * ブロックしていない敵も削るようになったため、この上限が無いと経路の脇に
 * 置いた守り手が群れに瞬殺される。
 */
export const MAX_ATTACKERS_PER_UNIT = 3;

/**
 * その守り手を殴っている敵（進行度の高い順に上限まで）
 *
 * **既知の非対称（設計書 §12.1.1 の申し送り。この反復では直さない）**:
 * 上限を `progress` 降順で切るため、**壁を通り過ぎた敵が、実際に壁でブロックされて
 * いる敵を枠から押し出す。** 実測では壁の手前で止まった雑兵3体がダメージ0 で、
 * 通り過ぎた雑兵3体だけが壁を殴っていた。設計書 §4.1 は標的の選択（ブロッカー優先）
 * しか規定していないため契約違反ではないが、石壁が受ける摩耗が想定より減る方向に効く。
 * 直すなら「ブロックしている敵を優先し、残り枠を射程攻撃者で埋める」形になるが、
 * `balance.test.ts` の不変条件5本を全部測り直すことになるため次の反復で扱う。
 */
export const attackersFor = (
  ctx: BlockContext,
  enemies: readonly ActiveEnemy[],
  unitIndex: number
): ActiveEnemy[] =>
  enemies
    .filter((e) => attackTargetIndexFor(ctx, e) === unitIndex)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, MAX_ATTACKERS_PER_UNIT);
