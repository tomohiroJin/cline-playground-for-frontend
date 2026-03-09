/**
 * スキル関連の定数
 */
import type { ASkillDef, SfxDef } from '../types';

/** アクティブスキル定義 */
export const A_SKILLS: readonly ASkillDef[] = Object.freeze([
  Object.freeze({ id: 'fB' as const, nm: '炎の爆発', ds: '敵に45ダメージ', ct: 'tech' as const, rL: 3, cd: 2, fx: Object.freeze({ t: 'dmgAll' as const, bd: 45, mul: 1 }), ic: '🔥' }),
  Object.freeze({ id: 'nH' as const, nm: '自然の癒し', ds: 'HP40回復', ct: 'life' as const, rL: 3, cd: 3, fx: Object.freeze({ t: 'healAll' as const, bh: 40, aR: 0.2 }), ic: '🌿' }),
  Object.freeze({ id: 'bR' as const, nm: '血の狂乱', ds: 'ATK×2 HP-20 3T', ct: 'rit' as const, rL: 3, cd: 2, fx: Object.freeze({ t: 'buffAtk' as const, aM: 2, hC: 20, dur: 3 }), ic: '💀' }),
  Object.freeze({ id: 'sW' as const, nm: '盾の壁', ds: '被ダメ-50% 2T', ct: 'bal' as const, rL: 4, cd: 3, fx: Object.freeze({ t: 'shield' as const, dR: 0.5, dur: 2 }), ic: '🛡️' }),
]);

/** SFX 定義 */
export const SFX_DEFS: Readonly<Record<string, SfxDef>> = Object.freeze({
  hit: Object.freeze({ f: Object.freeze([180, 80]), fd: 0.1, g: 0.12, gd: 0.12, w: 'square' as const }),
  crit: Object.freeze({ f: Object.freeze([400, 100]), fd: 0.15, g: 0.12, gd: 0.18, w: 'sawtooth' as const }),
  kill: Object.freeze({ f: Object.freeze([300, 600, 200]), fd: 0.25, g: 0.12, gd: 0.3, w: 'square' as const }),
  heal: Object.freeze({ f: Object.freeze([400, 800]), fd: 0.15, g: 0.12, gd: 0.2, w: 'sine' as const }),
  evo: Object.freeze({ f: Object.freeze([300, 900]), fd: 0.2, g: 0.12, gd: 0.3, w: 'sine' as const }),
  death: Object.freeze({ f: Object.freeze([200, 40]), fd: 0.4, g: 0.12, gd: 0.5, w: 'sawtooth' as const }),
  click: Object.freeze({ f: Object.freeze([600]), fd: 0.05, g: 0.06, gd: 0.05, w: 'sine' as const }),
  boss: Object.freeze({ f: Object.freeze([80, 200, 60]), fd: 0.35, g: 0.12, gd: 0.4, w: 'sawtooth' as const }),
  win: Object.freeze({ f: Object.freeze([400, 600, 500, 800]), fd: 0.3, g: 0.12, gd: 0.4, w: 'sine' as const }),
  skFire: Object.freeze({ f: Object.freeze([200, 400, 100]), fd: 0.2, g: 0.12, gd: 0.25, w: 'sawtooth' as const }),
  skHeal: Object.freeze({ f: Object.freeze([300, 600, 800]), fd: 0.2, g: 0.1, gd: 0.3, w: 'sine' as const }),
  skRage: Object.freeze({ f: Object.freeze([100, 300, 80]), fd: 0.25, g: 0.12, gd: 0.3, w: 'square' as const }),
  skShield: Object.freeze({ f: Object.freeze([500, 700, 400]), fd: 0.2, g: 0.08, gd: 0.25, w: 'sine' as const }),
  synergy: Object.freeze({ f: Object.freeze([440, 554, 659]), fd: 0.2, g: 0.1, gd: 0.25, w: 'sine' as const }),
  event: Object.freeze({ f: Object.freeze([330, 440]), fd: 0.15, g: 0.08, gd: 0.2, w: 'triangle' as const }),
  achv: Object.freeze({ f: Object.freeze([523, 659, 784, 1047]), fd: 0.1, g: 0.06, gd: 0.35, w: 'sine' as const }),
  plDmg: Object.freeze({ f: Object.freeze([120, 60]), fd: 0.1, g: 0.1, gd: 0.15, w: 'sawtooth' as const }),
  allyJoin: Object.freeze({ f: Object.freeze([440, 660, 880]), fd: 0.15, g: 0.08, gd: 0.25, w: 'sine' as const }),
  civUp: Object.freeze({ f: Object.freeze([523, 659, 784]), fd: 0.12, g: 0.08, gd: 0.2, w: 'triangle' as const }),
  envDmg: Object.freeze({ f: Object.freeze([150, 80, 50]), fd: 0.15, g: 0.08, gd: 0.2, w: 'square' as const }),
});
