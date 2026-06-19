/**
 * キーストーンサービス
 *
 * キーストーン効果を tick-phases の各フックから呼ぶ純粋関数群。
 * 効果ロジックを戦闘ティックから分離し、テスト容易性を保つ。
 */
import type { RunState, KeystoneId } from '../../types';

/** 指定キーストーンを取得済みか */
export function hasKeystone(r: RunState, id: KeystoneId): boolean {
  return (r.keystones ?? []).includes(id);
}

/** キーストーンを取得適用した新しい RunState を返す（純粋） */
export function applyKeystone(r: RunState, id: KeystoneId): RunState {
  const next: RunState = { ...r, keystones: [...(r.keystones ?? []), id] };

  // 諸刃の進化: DEFを0にし、失ったDEF×3をATKへ変換（取得時1回）
  if (id === 'double_edge') {
    const lostDef = next.def;
    next.def = 0;
    next.atk = next.atk + lostDef * 3;
  }

  return next;
}

/** 戦闘開始時に per-battle のキーストーン状態をリセットする（破壊的） */
export function resetKeystoneBattleState(r: RunState): void {
  r.ksGuardUsed = false;
}
