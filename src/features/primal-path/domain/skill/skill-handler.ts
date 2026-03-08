/**
 * スキルハンドラーインターフェース
 *
 * Strategy パターンにより、スキル効果の追加を
 * 既存コードの修正なしで実現する（OCP準拠）。
 */
import type { RunState, ASkillDef, TickEvent } from '../../types';

/** スキル効果の実行結果 */
export interface SkillResult {
  readonly nextRun: RunState;
  readonly events: readonly TickEvent[];
}

/** スキルハンドラーインターフェース */
export interface SkillHandler {
  /** スキル効果を実行する */
  execute(run: RunState, def: ASkillDef): SkillResult;
}

/** スキルハンドラーレジストリ型 */
export type SkillRegistry = ReadonlyMap<string, SkillHandler>;
