/**
 * 迷宮の残響 - 移行期間中の互換型・ヘルパー
 *
 * 旧型（st, bestFl 等）と新型（statuses, bestFloor 等）の間の互換性を提供する。
 * Phase 6 で旧型を廃止した後に削除する予定。
 *
 * TODO(Phase 6): 旧型フィールドの廃止後にこのファイルを削除する
 */
import type { StatusEffectId } from './player';

// ── StatusEffectId 型ガード ──────────────────────────

/** StatusEffectId のリテラル集合 */
const STATUS_EFFECT_IDS = new Set<string>(['負傷', '混乱', '出血', '恐怖', '呪い']);

/** 文字列が StatusEffectId かどうかを判定する型ガード */
export const isStatusEffectId = (s: string): s is StatusEffectId =>
  STATUS_EFFECT_IDS.has(s);

// ── Player 互換型 ──────────────────────────────────────

/**
 * 移行期間中のPlayer互換型
 * 旧型（st: string[]）と新型（statuses: StatusEffectId[]）の両方をサポート。
 * TODO(Phase 6): 新型 Player に統一後、この型を削除する
 */
export interface PlayerLike {
  readonly hp: number;
  readonly maxHp: number;
  readonly mn: number;
  readonly maxMn: number;
  readonly inf: number;
  readonly st?: readonly string[];
  readonly statuses?: readonly StatusEffectId[];
}

/**
 * プレイヤーのステータス配列を安全に取得する（旧st/新statuses 互換）
 * statuses が存在すれば優先、なければ st、どちらもなければ空配列
 */
export const getPlayerStatuses = (player: PlayerLike): readonly string[] =>
  (player.statuses as readonly string[] | undefined) ?? player.st ?? [];

// ── Difficulty 互換型 ──────────────────────────────────

/**
 * 移行期間中のDifficulty互換型
 * 旧型（フラット構造）と新型（modifiers/rewards サブオブジェクト）の共通部分。
 * TODO(Phase 6): 新型 DifficultyDef に統一後、この型を削除する
 */
export interface DifficultyLike {
  readonly id?: string;
  readonly hpMod?: number;
  readonly mnMod?: number;
  readonly drainMod: number;
  readonly dmgMult: number;
}
