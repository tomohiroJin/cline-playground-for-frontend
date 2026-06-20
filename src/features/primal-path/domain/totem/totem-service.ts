/**
 * 始祖トーテムサービス
 *
 * ラン初期化時にトーテム効果を RunState へ適用する純粋関数。
 */
import type { RunState, TotemId } from '../../types';
import { TOTEMS } from '../../constants';
import { clamp } from '../shared/utils';

/** トーテム効果を適用した新しい RunState を返す（純粋） */
export function applyTotem(r: RunState, totemId: TotemId): RunState {
  const def = TOTEMS.find(t => t.id === totemId);
  if (!def) return r;
  const e = def.effect;

  const next: RunState = { ...r, totemId };

  // ステータス倍率/加算
  if (e.mhpMul) {
    next.mhp = Math.floor(r.mhp * e.mhpMul);
    next.hp = Math.min(r.hp, next.mhp);
  }
  if (e.atkMul) next.atk = Math.floor(next.atk * e.atkMul);
  if (e.crAdd) next.cr = clamp(next.cr + e.crAdd, 0, 1);
  if (e.defAdd) next.def = next.def + e.defAdd;

  // 環境ダメージ軽減（岩の祖）: 既存の環境抵抗 iR/fR に加算し、calcEnvDmg が自然に反映する
  if (e.envDmgR) {
    next.tb = { ...next.tb, iR: (next.tb.iR || 0) + e.envDmgR, fR: (next.tb.fR || 0) + e.envDmgR };
  }
  // 覚醒要求緩和（霊の祖）: 早期覚醒。最小1にクランプ
  if (e.awkReqReduce) {
    next.saReq = Math.max(1, next.saReq - e.awkReqReduce);
    next.fReq = Math.max(1, next.fReq - e.awkReqReduce);
  }
  // 覚醒効果増（霊の祖）: applyAwkFx が参照する倍率を保持
  if (e.awkMul) next.awkMul = e.awkMul;

  // 仲間枠・火傷・仲間ATK
  if (e.mxaAdd) next.mxA = next.mxA + e.mxaAdd;
  if (e.burnDmgMul) next.burnDmgMul = e.burnDmgMul;
  if (e.allyAtkBonus) next.allyAtkBonus = e.allyAtkBonus;

  // 開始仲間（次タスクの群れの祖で利用、配列はコピーして不変性を保つ）
  if (e.startAlly) {
    const am = 1 + (next.tb.aA || 0) + (e.allyAtkBonus || 0);
    next.al = [
      ...r.al,
      {
        n: e.startAlly.n,
        hp: Math.floor(e.startAlly.hp),
        mhp: Math.floor(e.startAlly.hp),
        atk: Math.floor(e.startAlly.atk * am),
        t: e.startAlly.t, a: 1, h: e.startAlly.h, tk: e.startAlly.tk,
      },
    ];
  }

  // 種火の祖: 踏破スケールの基準ステを snapshot（atkMul 適用後の値）
  if (e.biomeScale) {
    next.emberBase = { atk: next.atk, def: next.def, mhp: next.mhp };
  }

  return next;
}
