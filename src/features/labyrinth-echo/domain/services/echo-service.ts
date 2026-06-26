/**
 * 迷宮の残響 - EchoService（残響進行サービス）
 *
 * 残響深度・断片解禁・先人進捗・真相レイヤー導出の純粋関数群。外部依存なし。
 */
import { ECHO_FRAGMENTS } from '../constants/echo-fragment-defs';
import { TRUTH_LAYERS } from '../constants/truth-defs';
import type { TruthLayer } from '../constants/truth-defs';
import type { EchoFragment } from '../models/echo';

/** 残響深度の上限（Phase 5 で拡張） */
export const ECHO_DEPTH_MAX = 6;

/** 残響深度を +1 する（上限でクランプ） */
export const incrementEchoDepth = (d: number): number =>
  Math.min((d ?? 0) + 1, ECHO_DEPTH_MAX);

/** 断片が現在の深度で解禁可能か */
export const isFragmentUnlockable = (f: EchoFragment, echoDepth: number): boolean =>
  f.depthGate <= echoDepth;

/**
 * セーフティネット断片を選ぶ。
 * 解禁済み（depthGate<=echoDepth）かつ未収集の断片から、
 * order 昇順 → predecessorId 昇順で最小の1件を返す。なければ null。
 */
export const selectSafetyNetFragment = (
  echoDepth: number,
  collected: readonly string[],
): EchoFragment | null => {
  const candidates = ECHO_FRAGMENTS
    .filter(f => isFragmentUnlockable(f, echoDepth) && !collected.includes(f.id))
    .sort((a, b) => a.order - b.order || a.predecessorId.localeCompare(b.predecessorId));
  return candidates[0] ?? null;
};

/** 先人の断片を order 昇順で返す */
export const predecessorFragments = (predId: string): EchoFragment[] =>
  ECHO_FRAGMENTS.filter(f => f.predecessorId === predId).sort((a, b) => a.order - b.order);

/** 先人の収集進捗（収集数/総数） */
export const predecessorProgress = (
  predId: string,
  collected: readonly string[],
): { collected: number; total: number } => {
  const all = predecessorFragments(predId);
  return { collected: all.filter(f => collected.includes(f.id)).length, total: all.length };
};

/** 先人を1片でも発見済みか */
export const isPredecessorDiscovered = (predId: string, collected: readonly string[]): boolean =>
  predecessorFragments(predId).some(f => collected.includes(f.id));

/** 先人の断片を全て収集済みか */
export const isPredecessorComplete = (predId: string, collected: readonly string[]): boolean => {
  const p = predecessorProgress(predId, collected);
  return p.total > 0 && p.collected === p.total;
};

/** echoDepth で開示済みの真相レイヤーを返す */
export const unlockedTruthLayers = (echoDepth: number): TruthLayer[] =>
  TRUTH_LAYERS.filter(t => t.depthGate <= echoDepth);
