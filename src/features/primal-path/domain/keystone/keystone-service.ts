/**
 * キーストーンサービス
 *
 * キーストーン効果を tick-phases の各フックから呼ぶ純粋関数群。
 * 効果ロジックを戦闘ティックから分離し、テスト容易性を保つ。
 */
import type { RunState, KeystoneId } from '../../types';
import { aliveAllies } from '../battle/combat-calculator';

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

/** プレイヤー攻撃前の ATK 修飾（flat 加算と乗算）を集計する */
export function keystonePlayerAtkMods(r: RunState): { flatAdd: number; mult: number } {
  let flatAdd = 0;
  let mult = 1;

  // 晩成系の flat 加算
  if (hasKeystone(r, 'bone_eater')) flatAdd += Math.floor((r.bE ?? 0) / 10);
  if (hasKeystone(r, 'hunter_stack')) flatAdd += r.ksStacks?.hunter_stack ?? 0;

  // 乗算系（複数キーストーン取得時は順に積算）
  if (hasKeystone(r, 'madblood') && r.hp < r.mhp * 0.3) mult *= 2;
  if (hasKeystone(r, 'wolf_pack')) mult *= 1 + 0.1 * aliveAllies(r.al).length;
  if (hasKeystone(r, 'primal_roar')) mult *= 1 + Math.max(0, 0.5 - 0.1 * (r.cW - 1));

  return { flatAdd, mult };
}
