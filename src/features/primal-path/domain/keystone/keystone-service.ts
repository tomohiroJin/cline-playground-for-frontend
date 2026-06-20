/**
 * キーストーンサービス
 *
 * キーストーン効果を tick-phases の各フックから呼ぶ効果関数群。
 * 効果ロジックを戦闘ティックから分離し、テスト容易性を保つ。
 * 注: applyKeystone は純粋関数。一方、ティック内フック（resetKeystoneBattleState・
 * onKeystoneKill・keystoneLethalGuard）は deepClone 済みの RunState を破壊的に更新する。
 */
import type { RunState, KeystoneId, KeystoneDef } from '../../types';
import { KEYSTONES, TOTEMS, DRAFT_KEYSTONE_RATE } from '../../constants';
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

/** 被ダメージの反射量を返す（棘の守護） */
export function keystoneReflectDmg(r: RunState, takenDmg: number): number {
  if (!hasKeystone(r, 'thorn_guard')) return 0;
  return Math.floor(takenDmg * 0.3);
}

/** このターン敵攻撃を無効化するか（永久凍結） */
export function isKeystoneFreezeTurn(r: RunState): boolean {
  return hasKeystone(r, 'eternal_freeze') && r.wTurn > 0 && r.wTurn % 4 === 0;
}

/** 致死ダメージを HP1 で耐えるか（不滅の祈り）。耐えた場合 true（破壊的） */
export function keystoneLethalGuard(r: RunState): boolean {
  if (!hasKeystone(r, 'undying_prayer') || r.ksGuardUsed) return false;
  r.hp = 1;
  r.ksGuardUsed = true;
  return true;
}

/** 敵撃破時のキーストーン処理（破壊的。スタック更新） */
export function onKeystoneKill(r: RunState): void {
  // キーストーン未所持なら早期リターン（既存挙動に影響しない）
  if (!r.keystones?.length) return;
  const stacks: Record<string, number> = { ...(r.ksStacks ?? {}) };
  // 狩人の蓄積: キルごとに ATK スタック +3（ksStacks に蓄積、ラン中永続）
  if (hasKeystone(r, 'hunter_stack')) stacks.hunter_stack = (stacks.hunter_stack ?? 0) + 3;
  // 連鎖の業火: 火傷状態（r.burn）でのキルで火傷ダメージ倍率が +0.2（ラン中永続）
  if (hasKeystone(r, 'chain_blaze') && r.burn) stacks.chain_blaze = (stacks.chain_blaze ?? 0) + 0.2;
  r.ksStacks = stacks;
}

/** 未取得のキーストーン一覧を返す */
export function unownedKeystones(r: RunState): KeystoneDef[] {
  return KEYSTONES.filter(k => !hasKeystone(r, k.id));
}

/** 節目でキーストーンを提示すべきか（未取得が残っているか） */
export function shouldOfferKeystone(r: RunState): boolean {
  return unownedKeystones(r).length > 0;
}

/** 進化ドラフトに低確率で混入する未取得キーストーンを1枚返す（外れ/未取得0なら undefined） */
export function rollDraftKeystone(r: RunState, rng: () => number = Math.random): KeystoneDef | undefined {
  if (rng() >= DRAFT_KEYSTONE_RATE) return undefined;
  const pool = unownedKeystones(r);
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length)];
}

/** 節目の3択を抽選する（最大3・distinct・トーテム curve 一致を重み2で優先） */
export function rollKeystones(r: RunState, rng: () => number = Math.random): KeystoneDef[] {
  const pool = unownedKeystones(r);
  // 未取得が3以下なら残り全てを返す
  if (pool.length <= 3) return pool;

  const totemCurve = TOTEMS.find(t => t.id === r.totemId)?.curve;
  const avail = [...pool];
  const result: KeystoneDef[] = [];
  while (result.length < 3 && avail.length > 0) {
    // curve 一致を重み2、それ以外を重み1とした重み付き抽選
    const weights = avail.map(k => (totemCurve && k.curve === totemCurve ? 2 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let pick = rng() * total;
    let idx = 0;
    while (idx < weights.length - 1 && pick >= weights[idx]) {
      pick -= weights[idx];
      idx++;
    }
    result.push(avail[idx]);
    avail.splice(idx, 1);
  }
  return result;
}
