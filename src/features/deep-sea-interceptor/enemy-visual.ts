// ============================================================================
// Deep Sea Interceptor - 通常敵の見た目・挙動メタデータ
// 描画・移動・危険度表示・発射予兆が同一テーブルを参照する（DRY）。
// ============================================================================

import type { Enemy, EnemyType } from './types';

/** 見た目・挙動を一元管理する通常敵4種 */
export type RegularEnemyType = 'basic' | 'fast' | 'shooter' | 'tank';

/** シルエット種別（EnemySprite の描画分岐キー） */
export type EnemySilhouette = 'jellyfish' | 'dart' | 'angler' | 'shell';

/** 危険度（色・縁取り・リングで表現） */
export type DangerLevel = 'low' | 'mid' | 'high';

/** 動きパターンのキー（MovementStrategies に対応） */
export type EnemyMovementKey = 'straight' | 'sine' | 'drift' | 'weave';

/** 通常敵の見た目・挙動定義 */
export interface EnemyVisualDef {
  silhouette: EnemySilhouette;
  glowColor: string;
  danger: DangerLevel;
  movement: EnemyMovementKey;
}

/**
 * 通常敵4種の見た目・挙動テーブル。
 * ネオン基調色は Phase 1 の neonGlow に渡す前提で高彩度の発光色を選ぶ。
 */
export const EnemyVisual: Record<RegularEnemyType, EnemyVisualDef> = Object.freeze({
  // クラゲ: 低速で漂う、無害寄り
  basic: { silhouette: 'jellyfish', glowColor: '#3fe0d0', danger: 'low', movement: 'drift' },
  // 深海ダーツ: 素早い蛇行、鋭い形で速さを伝える
  fast: { silhouette: 'dart', glowColor: '#6a7bff', danger: 'mid', movement: 'weave' },
  // 提灯アンコウ: 自機を狙って撃つ。最も危険
  shooter: { silhouette: 'angler', glowColor: '#ff4fa0', danger: 'high', movement: 'sine' },
  // 甲殻ユニット: 重く直進、硬い
  tank: { silhouette: 'shell', glowColor: '#ffab3d', danger: 'mid', movement: 'straight' },
});

/** 通常敵4種かどうかの型ガード */
export const isRegularEnemyType = (type: EnemyType | string): type is RegularEnemyType =>
  type === 'basic' || type === 'fast' || type === 'shooter' || type === 'tank';

/** 型に対応する見た目定義を返す（非通常敵は undefined） */
export const getEnemyVisual = (type: EnemyType | string): EnemyVisualDef | undefined =>
  isRegularEnemyType(type) ? EnemyVisual[type] : undefined;

/** 発射予兆の先行時間（ms）— 発射の何ミリ秒前からルアーを光らせるか */
export const TELEGRAPH_LEAD_MS = 400;

/**
 * 敵が「まもなく発射する」予兆状態かを判定する（純粋関数）。
 * 発射可能かつ画面内で、クールダウン残りが先行時間を切ったら true。
 * EnemyConfig を参照して fireRate>0 の敵のみ対象にする。
 */
export const isEnemyTelegraphing = (enemy: Enemy, now: number): boolean => {
  if (!enemy.canShoot || enemy.fireRate <= 0 || enemy.y <= 0) return false;
  const elapsed = now - enemy.lastShotAt;
  return elapsed >= enemy.fireRate - TELEGRAPH_LEAD_MS;
};

/** 被弾フラッシュの表示時間（ms） */
export const HIT_FLASH_MS = 120;

/**
 * 敵が被弾フラッシュ中かを判定する（純粋関数）。
 * lastHitAt から HIT_FLASH_MS 以内なら true。未被弾（0/undefined）は false。
 */
export const isEnemyHitFlashing = (enemy: Enemy, now: number): boolean => {
  const lastHitAt = enemy.lastHitAt ?? 0;
  if (lastHitAt <= 0) return false;
  return now - lastHitAt < HIT_FLASH_MS;
};
