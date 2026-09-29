/**
 * 灰燼の城壁 - 敵へのダメージの一本化（反復7 段階2・設計書 §4.2 (1)）
 *
 * 罠・射撃・範囲・貫通・業火の5経路は、すべて applyDamage を通して hpById を削る。
 * 理由は2つ:
 * 1. **装甲は1ヒットごとに引く**（設計書 §4.1）。経路ごとに書くと、どこか1つで
 *    引き忘れる・合計してから引く、という誤りが静かに入る
 * 2. **撃破源は「最後に削った者」**（combat-state.ts の DefeatSource の契約）。
 *    装甲で 0 に抑えられた命中は削っていないので、sourceById を書き換えない
 *
 * 生死の確定はしない（resolveDamage が全経路の後にまとめて行う）。
 */
import type { ActiveEnemy, DefeatSource, TickEvent } from './combat-state';
import { getEnemySpec } from './enemies';
import { isEnemyFlying } from './enemy-status';

/** 敵ごとの「最後に削った者」。hpById と対で applyDamage だけが書く */
export type SourceById = Map<number, DefeatSource>;

/** 1 tick 分のダメージの下書き（罠・射撃・業火で共有する作業用の値） */
export interface DamageDraft {
  hpById: Map<number, number>;
  sourceById: SourceById;
  events: TickEvent[];
}

/** 1ヒット。armor は hitOn が敵定義から埋める */
export interface DamageHit {
  enemy: ActiveEnemy;
  /** 軽減前のダメージ */
  raw: number;
  source: DefeatSource;
  armor: number;
}

/** 敵の装甲（省略は0） */
export const armorOf = (enemy: ActiveEnemy): number => getEnemySpec(enemy.enemyId).armor ?? 0;

/** その敵への命中を作る。装甲を呼び出し側に渡させない（渡し忘れの経路を作らない） */
export const hitOn = (enemy: ActiveEnemy, raw: number, source: DefeatSource): DamageHit => ({
  enemy,
  raw,
  source,
  armor: armorOf(enemy),
});

/**
 * 1ヒットを下書きに反映し、実際に削った量を返す
 *
 * - raw <= 0（落網）は何もしない
 * - 装甲は1ヒットごとに引き、最低0
 * - 削った量が 0 より大きいときだけ撃破源を書き換える
 * - 装甲を持つ敵への命中は、軽減0 を含めて armor-hit を積む（表示の材料）
 */
export const applyDamage = (draft: DamageDraft, hit: DamageHit): number => {
  if (hit.raw <= 0) return 0;
  const dealt = Math.max(0, hit.raw - hit.armor);
  const current = draft.hpById.get(hit.enemy.id) ?? hit.enemy.hp;
  draft.hpById.set(hit.enemy.id, current - dealt);
  if (dealt > 0) draft.sourceById.set(hit.enemy.id, hit.source);
  if (hit.armor > 0) {
    draft.events.push({ kind: 'armor-hit', enemyId: hit.enemy.id, raw: hit.raw, dealt, armor: hit.armor });
  }
  return dealt;
};

/** その塔がその敵に当たるか（飛行は対空の塔だけ。地上化中は地上と同じ） */
export const canTowerHit = (spec: { hitsFlying: boolean }, enemy: ActiveEnemy, tick: number): boolean =>
  spec.hitsFlying || !isEnemyFlying(enemy, tick);
