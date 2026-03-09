/**
 * RunState 不変条件
 *
 * Reducer の状態遷移後に呼び出して、状態全体の整合性を検証する。
 */
import type { RunState } from '../types';
import { invariant } from '../contracts';

/** RunState の不変条件を検証する */
export function assertRunInvariant(run: RunState): void {
  invariant(run.hp <= run.mhp, `HP(${run.hp}) > maxHP(${run.mhp})`);
  invariant(run.bc >= 0, `バイオームクリア数が負: ${run.bc}`);
  invariant(run.kills >= 0, `撃破数が負: ${run.kills}`);

  const maxEvo = run.maxEvo ?? Infinity;
  invariant(
    run.evs.length <= maxEvo,
    `進化数が上限超過: ${run.evs.length} > ${maxEvo}`,
  );
}
