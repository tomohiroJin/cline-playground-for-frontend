/**
 * スキルハンドラーの共通基盤
 *
 * deepCloneRun + 型ガードのボイラープレートを共通化する。
 */
import type { SkillResult } from '../skill-handler';
import type { RunState, ASkillDef, SkillFx, TickEvent } from '../../../types';
import { deepCloneRun } from '../../shared/utils';

/**
 * スキルハンドラーのベース関数
 *
 * deepCloneRun、型ガード、空結果の返却を共通化し、
 * 各ハンドラーはビジネスロジックのみに集中できる。
 */
export function withSkillBase<T extends SkillFx['t']>(
  expectedType: T,
  run: RunState,
  def: ASkillDef,
  handler: (next: RunState, fx: Extract<SkillFx, { t: T }>, events: TickEvent[], def: ASkillDef) => void,
): SkillResult {
  const next = deepCloneRun(run);
  const events: TickEvent[] = [];

  if (def.fx.t !== expectedType) return { nextRun: next, events };

  handler(next, def.fx as Extract<SkillFx, { t: T }>, events, def);
  return { nextRun: next, events };
}
