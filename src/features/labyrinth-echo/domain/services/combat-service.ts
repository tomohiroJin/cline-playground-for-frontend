/**
 * 迷宮の残響 - CombatService（戦闘計算サービス）
 *
 * ダメージ計算・回復・ドレイン等の純粋関数群。
 * game-logic.ts から抽出。
 */
import { clamp } from '../../../../utils/math-utils';
import { CFG } from '../constants/config';
import { STATUS_META } from '../constants/status-effect-defs';
import type { Player, StatusEffectId } from '../models/player';
import { isStatusEffectId } from '../models/player';
import type { DifficultyDef } from '../models/difficulty';
import type { FxState } from '../models/unlock';

/** アウトカム結果値 */
interface OutcomeLike {
  readonly hp?: number;
  readonly mn?: number;
  readonly inf?: number;
}

/** SecondLife 判定結果 */
export interface SecondLifeResult {
  readonly activated: boolean;
  readonly player: Player;
}

/**
 * FX/難易度の修正値をアウトカムの生値に適用する（純粋関数）
 * @returns { hp, mn, inf }
 */
export const applyModifiers = (
  outcome: OutcomeLike,
  fx: FxState,
  diff: DifficultyDef | null,
  playerStatuses: readonly (string | StatusEffectId)[],
): { hp: number; mn: number; inf: number } => {
  let hp = outcome.hp ?? 0;
  let mn = outcome.mn ?? 0;
  let inf = outcome.inf ?? 0;

  // ── 修正値の適用順序 ──
  // 1. FX効果（アンロック由来）を先に適用
  //    - 回復量: healMult で増幅（hp > 0 の場合のみ）
  //    - ダメージ: hpReduce / mnReduce で軽減（hp < 0 / mn < 0 の場合のみ）
  // 2. 難易度修正（dmgMult）を後から適用
  //    - ダメージのみに影響し、回復には影響しない
  //    - HP と MN の両方に同じ倍率を適用
  // 3. 情報値は FX の infoMult のみ影響（難易度修正なし）
  // この順序により、FX軽減→難易度増幅の順でダメージが決定される。
  if (hp > 0) hp = Math.round(hp * fx.healMult);
  if (hp < 0) hp = Math.round(hp * fx.hpReduce);
  if (diff && diff.modifiers.dmgMult !== 1) {
    if (hp < 0) hp = Math.round(hp * diff.modifiers.dmgMult);
    if (mn < 0) mn = Math.round(mn * diff.modifiers.dmgMult);
  }
  if (inf > 0) inf = Math.round(inf * fx.infoMult);
  if (mn < 0) mn = Math.round(mn * fx.mnReduce);

  // 呪い状態で情報値半減
  if (playerStatuses.includes('呪い') && inf > 0) inf = Math.round(inf * CFG.CURSE_INFO_PENALTY);

  return { hp, mn, inf };
};

/**
 * プレイヤーにステータス変更を適用する（純粋関数）
 */
export const applyChangesToPlayer = (
  player: Player,
  changes: { hp: number; mn: number; inf: number },
  flag: string | null,
): Player => {
  const sts: string[] = [...player.statuses];
  let newSts = sts;
  if (flag?.startsWith(CFG.STATUS_FLAG_ADD_PREFIX)) {
    const s = flag.slice(CFG.STATUS_FLAG_ADD_PREFIX.length);
    // 型ガードで有効なステータスIDのみ追加する
    if (isStatusEffectId(s) && !sts.includes(s)) newSts = [...sts, s];
  }
  if (flag?.startsWith(CFG.STATUS_FLAG_REMOVE_PREFIX)) {
    newSts = sts.filter(s => s !== flag.slice(CFG.STATUS_FLAG_REMOVE_PREFIX.length));
  }
  // 有効な StatusEffectId のみを保持する
  const validStatuses = newSts.filter(isStatusEffectId);
  return {
    ...player,
    hp: clamp(player.hp + changes.hp, 0, player.maxHp),
    mn: clamp(player.mn + changes.mn, 0, player.maxMn),
    inf: Math.max(0, player.inf + changes.inf),
    statuses: validStatuses,
  };
};

/**
 * ターン経過ドレインを計算する（純粋関数）
 * @returns { player, drain: {hp,mn}|null }
 */
export const computeDrain = (
  player: Player,
  fx: FxState,
  diff: DifficultyDef | null,
): { player: Player; drain: { hp: number; mn: number } | null } => {
  const base = diff ? diff.modifiers.drainMod : -1;
  let hpD = 0;
  let mnD = fx.drainImmune ? 0 : base;

  for (const s of player.statuses) {
    // 型ガードで有効なステータスIDのみ処理する
    if (!isStatusEffectId(s)) continue;
    const tick = STATUS_META[s]?.tick;
    if (!tick) continue;
    let h = tick.hpDelta;
    const m = tick.mnDelta;
    if (s === '出血' && fx.bleedReduce) h = Math.round(h * CFG.BLEED_REDUCE_MULT);
    hpD += h;
    mnD += m;
  }

  if (hpD === 0 && mnD === 0) return { player, drain: null };

  return {
    player: {
      ...player,
      hp: clamp(player.hp + hpD, 0, player.maxHp),
      mn: clamp(player.mn + mnD, 0, player.maxMn),
    },
    drain: { hp: hpD, mn: mnD },
  };
};

/** ダメージ/回復のインパクトを分類する */
export const classifyImpact = (hp: number, mn: number): string | null => {
  if (hp < CFG.IMPACT_BIG_DMG_HP) return 'bigDmg';
  if (hp < 0 || mn < CFG.IMPACT_DMG_MN) return 'dmg';
  if (hp > 0) return 'heal';
  return null;
};

/**
 * SecondLife 復活判定（純粋関数）
 * HP or MNが0の場合、secondLife効果で半分回復して復活
 */
export const checkSecondLife = (
  player: Player,
  fx: FxState,
  usedSecondLife: boolean,
): SecondLifeResult => {
  const isDead = player.hp <= 0 || player.mn <= 0;
  if (!isDead || !fx.secondLife || usedSecondLife) {
    return { activated: false, player };
  }

  return {
    activated: true,
    player: {
      ...player,
      hp: Math.max(player.hp, Math.floor(player.maxHp * CFG.SECOND_LIFE_RECOVER_RATE)),
      mn: Math.max(player.mn, Math.floor(player.maxMn * CFG.SECOND_LIFE_RECOVER_RATE)),
    },
  };
};
