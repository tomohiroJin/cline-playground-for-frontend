/**
 * 進化状態の事前条件
 *
 * 進化操作の入口で進化状態が有効であることを検証する。
 */
import type { EvolutionState } from '../types';
import { invariant } from '../contracts';

/** 進化状態の事前条件を検証する */
export function requireValidEvolution(e: EvolutionState): void {
  const maxEvo = e.maxEvo ?? Infinity;
  invariant(
    e.evs.length <= maxEvo,
    `進化数が上限超過: ${e.evs.length} > ${maxEvo}`,
  );
}
