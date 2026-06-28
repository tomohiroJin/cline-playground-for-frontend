/**
 * 迷宮の残響 - LegacyService（残響継承サービス）
 *
 * レガシーの fx デルタを実効 fx に畳み込む純粋関数群。
 * 分類は computeFx と同じ（FX_MULT は乗算・FX_BOOL は OR・残りは加算）。
 */
import { FX_MULT, FX_BOOL } from '../models/unlock';
import type { FxState, FxMultKey, FxBoolKey } from '../models/unlock';
import type { EchoLegacy } from '../models/echo';
import { LEGACIES } from '../constants/legacy-defs';
import { isPredecessorComplete } from './echo-service';

/** レガシーの fx デルタを base にマージした実効 fx を返す（legacy=null なら base 不変返し） */
export const mergeLegacyIntoFx = (base: FxState, legacy: EchoLegacy | null): FxState => {
  if (!legacy) return base;
  const result: Record<string, number | boolean> = { ...base };
  for (const [k, v] of Object.entries(legacy.fx)) {
    if (FX_MULT.has(k as FxMultKey)) {
      result[k] = (result[k] as number) * (v as number);
    } else if (FX_BOOL.has(k as FxBoolKey)) {
      result[k] = (result[k] as boolean) || (v as boolean);
    } else {
      result[k] = (result[k] as number) + (v as number);
    }
  }
  return result as unknown as FxState;
};

/** 全断片収集済みの先人のレガシーだけを返す */
export const unlockedLegacies = (fragments: readonly string[]): EchoLegacy[] =>
  LEGACIES.filter(l => isPredecessorComplete(l.predecessorId, fragments));

/** IDからレガシーを取得（null/不明は null） */
export const getLegacyById = (id: string | null): EchoLegacy | null =>
  id ? LEGACIES.find(l => l.id === id) ?? null : null;

/** 先人IDからレガシーを取得（無ければ null） */
export const legacyForPredecessor = (predId: string): EchoLegacy | null =>
  LEGACIES.find(l => l.predecessorId === predId) ?? null;
