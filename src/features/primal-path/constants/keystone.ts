/**
 * キーストーン進化の定数レジストリ
 */
import type { KeystoneDef } from '../types';

/** キーストーン一覧（10種・アーキタイプ×カーブ網羅） */
export const KEYSTONES: readonly KeystoneDef[] = Object.freeze([
  Object.freeze({ id: 'madblood' as const, nm: '狂血の覚醒', ic: '🩸', tag: 'wild' as const, curve: 'front' as const, desc: 'HP30%以下の間 ATK×2' }),
  Object.freeze({ id: 'primal_roar' as const, nm: '原始の咆哮', ic: '🦁', tag: 'hunt' as const, curve: 'front' as const, desc: '序盤ATK+50%、ウェーブ毎に減衰' }),
  Object.freeze({ id: 'hunter_stack' as const, nm: '狩人の蓄積', ic: '🏹', tag: 'hunt' as const, curve: 'scaling' as const, desc: 'キルごとにATK+3（ラン中恒久）' }),
  Object.freeze({ id: 'wolf_pack' as const, nm: '群狼の戦術', ic: '🐺', tag: 'tribe' as const, curve: 'scaling' as const, desc: '生存仲間1体ごとにATK+10%' }),
  Object.freeze({ id: 'bone_eater' as const, nm: '骨喰らい', ic: '🦴', tag: 'spirit' as const, curve: 'scaling' as const, desc: '獲得骨10ごとにATK+1' }),
  Object.freeze({ id: 'chain_blaze' as const, nm: '連鎖の業火', ic: '🔥', tag: 'fire' as const, curve: 'combo' as const, desc: '火傷中にキルで火傷倍率+0.2（恒久）' }),
  Object.freeze({ id: 'thorn_guard' as const, nm: '棘の守護', ic: '🛡️', tag: 'shield' as const, curve: 'combo' as const, desc: '被ダメージの30%を反射' }),
  Object.freeze({ id: 'eternal_freeze' as const, nm: '永久凍結', ic: '🧊', tag: 'ice' as const, curve: 'combo' as const, desc: '4ターンごとに敵の攻撃を無効化' }),
  Object.freeze({ id: 'undying_prayer' as const, nm: '不滅の祈り', ic: '♻️', tag: 'regen' as const, curve: 'wild' as const, desc: '戦闘ごと1回、致死をHP1で耐える' }),
  Object.freeze({ id: 'double_edge' as const, nm: '諸刃の進化', ic: '⚔️', tag: 'wild' as const, curve: 'wild' as const, desc: 'DEFを0にし、失ったDEF×3をATKへ' }),
]);

/** 進化ドラフトにキーストーンが混入する確率（低確率） */
export const DRAFT_KEYSTONE_RATE = 0.12;
