/**
 * 迷宮の残響 - 条件評価システム
 *
 * Condition Discriminated Union型による型安全な条件評価。
 * 旧文字列形式との互換性も提供。
 */
import type { StatusEffectId } from '../models/player';
import type { FxState } from '../models/unlock';
import { invariant } from '../contracts/invariants';
import { getPlayerStatuses } from '../models/compat';
import type { PlayerLike } from '../models/compat';

/** 比較演算子 */
export type ComparisonOp = '>' | '<' | '>=' | '<=';

/** 条件の Discriminated Union */
export type Condition =
  | { type: 'default' }
  | { type: 'hp'; op: ComparisonOp; value: number }
  | { type: 'mn'; op: ComparisonOp; value: number }
  | { type: 'inf'; op: ComparisonOp; value: number }
  | { type: 'status'; statusId: StatusEffectId };

/** 比較演算を実行する */
const compare = (actual: number, op: ComparisonOp, threshold: number): boolean => {
  switch (op) {
    case '>': return actual > threshold;
    case '<': return actual < threshold;
    case '>=': return actual >= threshold;
    case '<=': return actual <= threshold;
  }
};

/** プレイヤーのHP実効値を取得する（dangerSense考慮） */
const getEffectiveHp = (player: PlayerLike, fx: FxState): number => {
  if (fx.dangerSense && player.hp < 30) return player.hp + 20;
  return player.hp;
};

/** プレイヤーのMN実効値を取得する（negotiator, mentalSense考慮） */
const getEffectiveMn = (player: PlayerLike, fx: FxState): number => {
  let mn = player.mn;
  if (fx.negotiator) mn += 8;
  if (fx.mentalSense && player.mn < 25) mn += 15;
  return mn;
};

/** プレイヤーのステータス配列を取得する（共通ヘルパー経由） */
const getStatuses = (player: PlayerLike): readonly string[] =>
  getPlayerStatuses(player);

/**
 * 条件を評価する純粋関数
 */
export const evaluateCondition = (condition: Condition, player: PlayerLike, fx: FxState): boolean => {
  switch (condition.type) {
    case 'default':
      return true;
    case 'status':
      return getStatuses(player).includes(condition.statusId);
    case 'hp': {
      // dangerSense は hp > 条件のみに適用（旧 evalCond 互換）
      const hpValue = condition.op === '>' ? getEffectiveHp(player, fx) : player.hp;
      return compare(hpValue, condition.op, condition.value);
    }
    case 'mn': {
      // negotiator/mentalSense は mn > 条件のみに適用（旧 evalCond 互換）
      const mnValue = condition.op === '>' ? getEffectiveMn(player, fx) : player.mn;
      return compare(mnValue, condition.op, condition.value);
    }
    case 'inf':
      return compare(player.inf, condition.op, condition.value);
  }
};

/**
 * 旧形式の文字列条件を新形式に変換する（移行期間用）
 * @throws 不明な条件形式の場合
 */
export const parseCondition = (condStr: string): Condition => {
  invariant(condStr.length > 0, 'parseCondition', '条件文字列が空です');

  if (condStr === 'default') return { type: 'default' };
  if (condStr.startsWith('status:')) {
    const statusId = condStr.slice(7);
    invariant(statusId.length > 0, 'parseCondition', 'ステータスIDが空です');
    return { type: 'status', statusId: statusId as StatusEffectId };
  }

  // hp>, hp<, mn>, mn<, inf>, inf< をパース
  const match = condStr.match(/^(hp|mn|inf)([><]=?)(\d+)$/);
  invariant(match !== null, 'parseCondition', `不明な条件形式: "${condStr}"`);

  const [, stat, op, val] = match;
  const value = parseInt(val, 10);
  invariant(!Number.isNaN(value), 'parseCondition', `数値の解析に失敗: "${val}"`);

  return {
    type: stat as 'hp' | 'mn' | 'inf',
    op: op as ComparisonOp,
    value,
  };
};

/**
 * 後方互換ラッパー — 旧 evalCond と同じシグネチャ
 */
export const evalCondCompat = (cond: string, player: PlayerLike, fx: FxState): boolean => {
  try {
    const condition = parseCondition(cond);
    return evaluateCondition(condition, player, fx);
  } catch {
    console.warn(`[evalCondCompat] Unknown format: "${cond}"`);
    return true;
  }
};
