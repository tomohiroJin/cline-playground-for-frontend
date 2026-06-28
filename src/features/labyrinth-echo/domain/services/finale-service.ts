/**
 * 迷宮の残響 - FinaleService（終章サービス）
 *
 * 真ルートの解禁判定・真エンディング選択・真相到達判定を提供する純粋関数群。
 */
import type { MetaState } from '../models/meta-state';
import type { EndingDef } from '../models/ending';
import type { FinaleDecision } from '../models/finale';
import { PREDECESSORS } from '../constants/predecessor-defs';
import { isPredecessorComplete } from './echo-service';
import { TRUE_ENDINGS, TRUE_ENDING_PROMOTE_PRESSURE } from '../constants/true-ending-defs';

/** 真ルート解禁に必要な残響深度（truth_4 開示と一致） */
export const TRUE_ROUTE_DEPTH_GATE = 6;

/** 真ルート（第6階層）が解禁されているか */
export const isTrueRouteUnlocked = (meta: MetaState): boolean =>
  meta.echoDepth >= TRUE_ROUTE_DEPTH_GATE &&
  PREDECESSORS.every(p => isPredecessorComplete(p.id, meta.fragments));

/** 終章の id から真エンディングを取得（内部用） */
const byId = (id: string): EndingDef => {
  const found = TRUE_ENDINGS.find(e => e.id === id);
  if (!found) throw new Error(`unknown true ending: ${id}`);
  return found;
};

/** 決断と昇格条件（圧≥しきい値 or 起源の継承）から真エンディングを決定する */
export const determineTrueEnding = (
  decision: FinaleDecision,
  pressure: number,
  legacyId: string | null,
): EndingDef => {
  const promoted = pressure >= TRUE_ENDING_PROMOTE_PRESSURE || legacyId === 'lg_first';
  if (decision === 'inherit') return byId(promoted ? 'te_inheritor_true' : 'te_inheritor');
  return byId(promoted ? 'te_liberator_true' : 'te_liberator');
};

/** いずれかの真エンディングに到達済みか */
export const hasReachedTrueEnding = (meta: MetaState): boolean =>
  meta.endings.some(id => id.startsWith('te_'));
