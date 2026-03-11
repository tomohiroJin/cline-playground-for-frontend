/**
 * 戦闘計算モジュール
 *
 * プレイヤー攻撃力、環境ダメージ、敵スケーリングなど
 * 戦闘における数値計算を担当する。
 */
import type {
  RunState, Enemy, Ally, CivLevels, BiomeId, BiomeIdExt, CivTypeExt,
  TreeBonus, PlayerAttackResult,
} from '../../types';
import { BIOME_AFFINITY, ENV_DMG } from '../../constants';
import { civLvs } from '../shared/civ-utils';

/* ===== 定数 ===== */

/** 儀式の低HP倍率閾値 (HP/MHP比) */
export const RIT_LOW_HP_RATIO = 0.3;
/** クリティカル倍率 */
const CRIT_MULTIPLIER = 1.6;

/* ===== 実効攻撃力 ===== */

/** 実効ATKを計算する（ATK × 攻撃倍率 × 被ダメ倍率） */
export function effATK(r: RunState): number {
  return Math.floor(r.atk * r.aM * r.dm);
}

/* ===== 仲間フィルタ ===== */

/** 生存中の仲間を返す */
export function aliveAllies(al: Ally[]): Ally[] {
  return al.filter(a => a.a);
}

/** 死亡した仲間を返す */
export function deadAllies(al: Ally[]): Ally[] {
  return al.filter(a => !a.a);
}

/* ===== バイオーム ===== */

/** バイオーム親和性によるダメージボーナス倍率を計算する */
export function biomeBonus(biome: BiomeIdExt, lvs: CivLevels): number {
  if (biome === 'final') return 1;
  const b = BIOME_AFFINITY[biome as BiomeId];
  return b && b.check(lvs) ? b.m : 1;
}

/* ===== 環境ダメージ ===== */

/** バイオームの環境ダメージを計算する */
export function calcEnvDmg(biome: BiomeIdExt, envScale: number, tb: TreeBonus, fe: CivTypeExt | null): number {
  const cfg = ENV_DMG[biome as BiomeId];
  if (!cfg) return 0;
  let d = Math.floor(cfg.base * envScale);
  d = Math.max(0, Math.floor(d * (1 - (tb[cfg.resist] || 0))));
  if (cfg.immune && fe === cfg.immune) d = 0;
  return d;
}

/* ===== 敵スケーリング ===== */

/** 敵をHP/ATK倍率でスケーリングする */
export function scaleEnemy(
  src: { n: string; hp: number; atk: number; def: number; bone: number },
  hm: number, am: number, scale = 1,
): Enemy {
  return {
    n: src.n,
    hp: Math.floor(src.hp * hm * scale),
    mhp: Math.floor(src.hp * hm * scale),
    atk: Math.floor(src.atk * am * scale),
    def: src.def,
    bone: src.bone,
  };
}

/* ===== プレイヤー攻撃 ===== */

/** プレイヤー攻撃のダメージ計算（儀式低HP×3、クリティカル、バイオームボーナス含む） */
export function calcPlayerAtk(r: RunState, rng = Math.random): PlayerAttackResult {
  let pa = effATK(r);
  if (r.fe === 'rit' && r.hp < r.mhp * RIT_LOW_HP_RATIO) pa *= 3;
  const crit = rng() < r.cr;
  if (crit) pa = Math.floor(pa * CRIT_MULTIPLIER);
  return { dmg: Math.floor(pa * biomeBonus(r.cBT, civLvs(r))), crit };
}
