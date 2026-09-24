/**
 * 灰燼の城壁 - 癒し手の回復（反復7 段階2・設計書 §4.1 / §4.2 (2)）
 *
 * **hpById を種まきした直後、罠より前に呼ぶ。** この tick に削られる前の HP に
 * 回復を足すので、「削られて 0 以下になった敵が同じ tick の回復で戻る」経路が
 * 構造的に存在しない（tick 内の蘇生が起きない）。
 *
 * 間隔は敵の攻撃と同じく `tick % intervalTicks === 0` で決め、敵に状態を増やさない。
 * 自分自身は回復しない。複数の癒し手は重ねてかかる。飛行の敵も回復する。
 */
import type { StageMap } from '../board/stage-map';
import type { ActiveEnemy, TickEvent } from './combat-state';
import { getEnemySpec, type EnemyHealSpec } from './enemies';
import { enemyPosition } from './enemy-position';

export interface HealContext {
  moved: readonly ActiveEnemy[];
  hpById: Map<number, number>;
  map: StageMap;
  tick: number;
  events: TickEvent[];
}

interface HealAttempt {
  healer: ActiveEnemy;
  target: ActiveEnemy;
  heal: EnemyHealSpec;
}

/** 1体の癒し手が1体の敵を回復する。戻した量が0なら何もしない */
const healOne = (ctx: HealContext, { healer, target, heal }: HealAttempt): void => {
  if (target.id === healer.id || !target.alive) return;
  const from = enemyPosition(ctx.map, healer);
  const to = enemyPosition(ctx.map, target);
  if (Math.hypot(to.x - from.x, to.y - from.y) > heal.radius) return;
  const current = ctx.hpById.get(target.id) ?? target.hp;
  const amount = Math.min(heal.amount, target.maxHp - current);
  if (amount <= 0) return;
  ctx.hpById.set(target.id, current + amount);
  ctx.events.push({ kind: 'enemy-healed', healerId: healer.id, targetId: target.id, amount });
};

/** 回復の tick にいる癒し手が、周囲の傷ついた敵を回復する */
export const applyEnemyHeals = (ctx: HealContext): void => {
  ctx.moved.forEach((healer) => {
    const heal = getEnemySpec(healer.enemyId).heal;
    if (!heal || !healer.alive) return;
    if (ctx.tick % heal.intervalTicks !== 0) return;
    ctx.moved.forEach((target) => healOne(ctx, { healer, target, heal }));
  });
};
