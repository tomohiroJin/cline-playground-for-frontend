/**
 * 迷宮の残響 - CombatService（戦闘計算サービス）
 *
 * ダメージ計算・回復・ドレイン等の純粋関数群。
 * game-logic.ts から抽出。
 */
import { clamp } from '../../../../utils/math-utils';
import { STATUS_META } from '../constants/status-effect-defs';
import type { StatusEffectId } from '../models/player';
import type { FxState } from '../models/unlock';
import { isStatusEffectId, getPlayerStatuses } from '../models/compat';
import type { PlayerLike, DifficultyLike } from '../models/compat';

/** アウトカム結果値 */
interface OutcomeLike {
  readonly hp?: number;
  readonly mn?: number;
  readonly inf?: number;
}

/** SecondLife 判定結果 */
export interface SecondLifeResult {
  readonly activated: boolean;
  readonly player: PlayerLike;
}

/**
 * FX/難易度の修正値をアウトカムの生値に適用する（純粋関数）
 * @returns { hp, mn, inf }
 */
export const applyModifiers = (
  outcome: OutcomeLike,
  fx: FxState,
  diff: DifficultyLike | null,
  playerStatuses: readonly (string | StatusEffectId)[],
): { hp: number; mn: number; inf: number } => {
  let hp = outcome.hp ?? 0;
  let mn = outcome.mn ?? 0;
  let inf = outcome.inf ?? 0;

  // 回復・ダメージ効果の適用
  if (hp > 0) hp = Math.round(hp * fx.healMult);
  if (hp < 0) hp = Math.round(hp * fx.hpReduce);
  if (diff && diff.dmgMult !== 1) {
    if (hp < 0) hp = Math.round(hp * diff.dmgMult);
    if (mn < 0) mn = Math.round(mn * diff.dmgMult);
  }
  if (inf > 0) inf = Math.round(inf * fx.infoMult);
  if (mn < 0) mn = Math.round(mn * fx.mnReduce);

  // 呪い状態で情報値半減
  if (playerStatuses.includes('呪い') && inf > 0) inf = Math.round(inf * 0.5);

  return { hp, mn, inf };
};

/**
 * プレイヤーにステータス変更を適用する（純粋関数）
 * 旧 applyToPlayer との互換性を維持
 */
export const applyChangesToPlayer = (
  player: PlayerLike,
  changes: { hp: number; mn: number; inf: number },
  flag: string | null,
): PlayerLike => {
  const sts = [...getPlayerStatuses(player)];
  let newSts = sts;
  if (flag?.startsWith('add:')) {
    const s = flag.slice(4);
    if (!sts.includes(s)) newSts = [...sts, s];
  }
  if (flag?.startsWith('remove:')) {
    newSts = sts.filter(s => s !== flag.slice(7));
  }
  // st と statuses を型安全に同期する
  const validStatuses = newSts.filter(isStatusEffectId);
  return {
    ...player,
    hp: clamp(player.hp + changes.hp, 0, player.maxHp),
    mn: clamp(player.mn + changes.mn, 0, player.maxMn),
    inf: Math.max(0, player.inf + changes.inf),
    st: newSts,
    statuses: validStatuses,
  };
};

/**
 * ターン経過ドレインを計算する（純粋関数）
 * @returns { player, drain: {hp,mn}|null }
 */
export const computeDrain = (
  player: PlayerLike,
  fx: FxState,
  diff: DifficultyLike | null,
): { player: PlayerLike; drain: { hp: number; mn: number } | null } => {
  const base = diff ? diff.drainMod : -1;
  let hpD = 0;
  let mnD = fx.drainImmune ? 0 : base;

  for (const s of getPlayerStatuses(player)) {
    const tick = STATUS_META[s as StatusEffectId]?.tick;
    if (!tick) continue;
    let h = tick.hpDelta;
    const m = tick.mnDelta;
    if (s === '出血' && fx.bleedReduce) h = Math.round(h * 0.5);
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
  if (hp < -15) return 'bigDmg';
  if (hp < 0 || mn < -10) return 'dmg';
  if (hp > 0) return 'heal';
  return null;
};

/**
 * SecondLife 復活判定（純粋関数）
 * HP or MNが0の場合、secondLife効果で半分回復して復活
 */
export const checkSecondLife = (
  player: PlayerLike,
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
      hp: Math.max(player.hp, Math.floor(player.maxHp / 2)),
      mn: Math.max(player.mn, Math.floor(player.maxMn / 2)),
    },
  };
};
