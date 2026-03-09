/**
 * 進化関連の定数
 */
import type { Evolution, SynergyBonusDef } from '../types';

/** 進化一覧 */
export const EVOS: readonly Evolution[] = Object.freeze([
  // tech tier 0
  Object.freeze({ n: '火おこし', d: 'ATK+3', t: 'tech' as const, r: 0, e: Object.freeze({ atk: 3 }), tags: Object.freeze(['fire' as const]) }),
  Object.freeze({ n: '投石術', d: 'ATK+2 会心+3%', t: 'tech' as const, r: 0, e: Object.freeze({ atk: 2, cr: 0.03 }), tags: Object.freeze(['hunt' as const]) }),
  Object.freeze({ n: '黒曜石の刃', d: 'ATK+5', t: 'tech' as const, r: 0, e: Object.freeze({ atk: 5 }), tags: Object.freeze(['hunt' as const]) }),
  Object.freeze({ n: '火矢', d: 'ATK+4 火傷', t: 'tech' as const, r: 0, e: Object.freeze({ atk: 4, burn: 1 }), tags: Object.freeze(['fire' as const, 'hunt' as const]) }),
  Object.freeze({ n: '罠の技術', d: 'ATK+3 DEF+1', t: 'tech' as const, r: 0, e: Object.freeze({ atk: 3, def: 1 }), tags: Object.freeze(['wild' as const]) }),
  Object.freeze({ n: '爆炎石', d: 'ATK+8', t: 'tech' as const, r: 1, e: Object.freeze({ atk: 8 }), tags: Object.freeze(['fire' as const]) }),
  Object.freeze({ n: '溶岩の槍', d: 'ATK+6 DEF+2', t: 'tech' as const, r: 1, e: Object.freeze({ atk: 6, def: 2 }), tags: Object.freeze(['fire' as const, 'shield' as const]) }),
  Object.freeze({ n: '雷の石斧', d: 'ATK+10 会心+5%', t: 'tech' as const, r: 1, e: Object.freeze({ atk: 10, cr: 0.05 }), tags: Object.freeze(['hunt' as const, 'wild' as const]) }),
  // life tier 0
  Object.freeze({ n: '薬草知識', d: 'HP+12', t: 'life' as const, r: 0, e: Object.freeze({ heal: 12 }), tags: Object.freeze(['regen' as const]) }),
  Object.freeze({ n: '革鎧', d: 'DEF+2', t: 'life' as const, r: 0, e: Object.freeze({ def: 2 }), tags: Object.freeze(['shield' as const]) }),
  Object.freeze({ n: '食糧備蓄', d: '最大HP+15', t: 'life' as const, r: 0, e: Object.freeze({ mhp: 15 }), tags: Object.freeze(['regen' as const]) }),
  Object.freeze({ n: '狩猟の知恵', d: 'ATK+2 DEF+1', t: 'life' as const, r: 0, e: Object.freeze({ atk: 2, def: 1 }), tags: Object.freeze(['hunt' as const, 'tribe' as const]) }),
  Object.freeze({ n: '仲間の絆', d: '仲間HP+10', t: 'life' as const, r: 0, e: Object.freeze({ aHL: 10 }), tags: Object.freeze(['tribe' as const]) }),
  Object.freeze({ n: '聖なる泉', d: '全回復 HP+10', t: 'life' as const, r: 1, e: Object.freeze({ full: 1, mhp: 10 }), tags: Object.freeze(['regen' as const, 'spirit' as const]) }),
  Object.freeze({ n: '大盾術', d: 'DEF+5', t: 'life' as const, r: 1, e: Object.freeze({ def: 5 }), tags: Object.freeze(['shield' as const]) }),
  Object.freeze({ n: '生命の樹', d: '最大HP+30 回復15', t: 'life' as const, r: 1, e: Object.freeze({ mhp: 30, heal: 15 }), tags: Object.freeze(['regen' as const, 'tribe' as const]) }),
  // rit tier 0
  Object.freeze({ n: '血の誓い', d: 'HP-8 ATK+6', t: 'rit' as const, r: 0, e: Object.freeze({ sd: 8, atk: 6 }), tags: Object.freeze(['wild' as const]) }),
  Object.freeze({ n: '骨の呪術', d: 'HP-5 ATK+4', t: 'rit' as const, r: 0, e: Object.freeze({ sd: 5, atk: 4 }), tags: Object.freeze(['spirit' as const]) }),
  Object.freeze({ n: '死霊の祝福', d: 'HP-10 ATK+8 DEF+1', t: 'rit' as const, r: 0, e: Object.freeze({ sd: 10, atk: 8, def: 1 }), tags: Object.freeze(['spirit' as const, 'shield' as const]) }),
  Object.freeze({ n: '狂気の舞', d: 'HP-15 ATK+12', t: 'rit' as const, r: 0, e: Object.freeze({ sd: 15, atk: 12 }), tags: Object.freeze(['wild' as const, 'hunt' as const]) }),
  Object.freeze({ n: '骨の收穫', d: 'HP-6 ATK+3 骨+2', t: 'rit' as const, r: 0, e: Object.freeze({ sd: 6, atk: 3, bb: 2 }), tags: Object.freeze(['wild' as const, 'tribe' as const]) }),
  Object.freeze({ n: '魂喰らい', d: 'HP-20 ATK+16 骨+3', t: 'rit' as const, r: 1, e: Object.freeze({ sd: 20, atk: 16, bb: 3 }), tags: Object.freeze(['spirit' as const, 'wild' as const]) }),
  Object.freeze({ n: '血の契約', d: 'HP半減 ATK×2', t: 'rit' as const, r: 1, e: Object.freeze({ half: 1, aM: 2 }), tags: Object.freeze(['wild' as const]) }),
  Object.freeze({ n: '禁忌の儀', d: 'HP-25 ATK+20 DEF+3', t: 'rit' as const, r: 1, e: Object.freeze({ sd: 25, atk: 20, def: 3 }), tags: Object.freeze(['spirit' as const, 'hunt' as const]) }),
  // special
  Object.freeze({ n: '魂呼びの儀', d: '仲間蘇生HP50%', t: 'life' as const, r: 1, e: Object.freeze({ revA: 50 }), tags: Object.freeze(['spirit' as const, 'tribe' as const]) }),
  Object.freeze({ n: '再誕の祈り', d: '仲間蘇生HP100% HP-10', t: 'rit' as const, r: 1, e: Object.freeze({ revA: 100, sd: 10 }), tags: Object.freeze(['spirit' as const]) }),
  // Phase 2 新規進化（デュアルタグ）
  Object.freeze({ n: '霜の牙', d: 'ATK+6 DEF+3', t: 'tech' as const, r: 0, e: Object.freeze({ atk: 6, def: 3 }), tags: Object.freeze(['ice' as const, 'hunt' as const]) }),
  Object.freeze({ n: '野火の種', d: 'ATK+10 火傷付与', t: 'tech' as const, r: 1, e: Object.freeze({ atk: 10, burn: 1 }), tags: Object.freeze(['fire' as const, 'wild' as const]) }),
  Object.freeze({ n: '根の盾', d: 'DEF+5 回復3', t: 'life' as const, r: 0, e: Object.freeze({ def: 5, heal: 3 }), tags: Object.freeze(['shield' as const, 'regen' as const]) }),
  Object.freeze({ n: '祖霊の祝福', d: '最大HP+20 仲間回復5', t: 'life' as const, r: 1, e: Object.freeze({ mhp: 20, aHL: 5 }), tags: Object.freeze(['spirit' as const, 'tribe' as const]) }),
  Object.freeze({ n: '血の熱狂', d: 'HP-10 ATK+8 会心+5%', t: 'rit' as const, r: 0, e: Object.freeze({ sd: 10, atk: 8, cr: 0.05 }), tags: Object.freeze(['wild' as const, 'hunt' as const]) }),
  Object.freeze({ n: '凍れる祈り', d: 'HP-12 DEF+8 ATK+5', t: 'rit' as const, r: 1, e: Object.freeze({ sd: 12, def: 8, atk: 5 }), tags: Object.freeze(['ice' as const, 'spirit' as const]) }),
]);

/** シナジーボーナス定義 */
export const SYNERGY_BONUSES: readonly SynergyBonusDef[] = Object.freeze([
  Object.freeze({
    tag: 'fire' as const,
    tier1: Object.freeze({ name: '灼熱の魂', description: '火傷ダメージ+30%', effect: Object.freeze({ type: 'damage_multiplier' as const, target: 'burn' as const, multiplier: 1.3 }) }),
    tier2: Object.freeze({ name: '業火の化身', description: '火傷ダメージ2倍 + ATK+10', effect: Object.freeze({ type: 'compound' as const, effects: Object.freeze([Object.freeze({ type: 'damage_multiplier' as const, target: 'burn' as const, multiplier: 2.0 }), Object.freeze({ type: 'stat_bonus' as const, stat: 'atk' as const, value: 10 })]) }) }),
  }),
  Object.freeze({
    tag: 'ice' as const,
    tier1: Object.freeze({ name: '凍てつく風', description: 'DEF+5', effect: Object.freeze({ type: 'stat_bonus' as const, stat: 'def' as const, value: 5 }) }),
    tier2: Object.freeze({ name: '永久凍土', description: 'DEF+12 + 環境ダメージ無効', effect: Object.freeze({ type: 'compound' as const, effects: Object.freeze([Object.freeze({ type: 'stat_bonus' as const, stat: 'def' as const, value: 12 }), Object.freeze({ type: 'special' as const, id: 'env_immune' })]) }) }),
  }),
  Object.freeze({
    tag: 'regen' as const,
    tier1: Object.freeze({ name: '生命の息吹', description: '再生HP+50%', effect: Object.freeze({ type: 'heal_bonus' as const, ratio: 0.5 }) }),
    tier2: Object.freeze({ name: '不死の泉', description: '再生HP2倍 + 毎ターン仲間も小回復', effect: Object.freeze({ type: 'compound' as const, effects: Object.freeze([Object.freeze({ type: 'heal_bonus' as const, ratio: 1.0 }), Object.freeze({ type: 'ally_bonus' as const, stat: 'hp' as const, value: 3 })]) }) }),
  }),
  Object.freeze({
    tag: 'shield' as const,
    tier1: Object.freeze({ name: '硬い皮膚', description: 'DEF+3', effect: Object.freeze({ type: 'stat_bonus' as const, stat: 'def' as const, value: 3 }) }),
    tier2: Object.freeze({ name: '岩の守護', description: 'DEF+8 + 仲間HP+5', effect: Object.freeze({ type: 'compound' as const, effects: Object.freeze([Object.freeze({ type: 'stat_bonus' as const, stat: 'def' as const, value: 8 }), Object.freeze({ type: 'ally_bonus' as const, stat: 'hp' as const, value: 5 })]) }) }),
  }),
  Object.freeze({
    tag: 'hunt' as const,
    tier1: Object.freeze({ name: '鋭い爪', description: 'ATK+8', effect: Object.freeze({ type: 'stat_bonus' as const, stat: 'atk' as const, value: 8 }) }),
    tier2: Object.freeze({ name: '捕食者の本能', description: 'ATK+15 + 会心率+10', effect: Object.freeze({ type: 'compound' as const, effects: Object.freeze([Object.freeze({ type: 'stat_bonus' as const, stat: 'atk' as const, value: 15 }), Object.freeze({ type: 'stat_bonus' as const, stat: 'cr' as const, value: 10 })]) }) }),
  }),
  Object.freeze({
    tag: 'spirit' as const,
    tier1: Object.freeze({ name: '霊的感応', description: '覚醒ゲージ+1', effect: Object.freeze({ type: 'special' as const, id: 'awakening_boost' }) }),
    tier2: Object.freeze({ name: '祖霊との交信', description: '覚醒効果1.5倍', effect: Object.freeze({ type: 'special' as const, id: 'awakening_power' }) }),
  }),
  Object.freeze({
    tag: 'tribe' as const,
    tier1: Object.freeze({ name: '部族の絆', description: '仲間ATK+5', effect: Object.freeze({ type: 'ally_bonus' as const, stat: 'atk' as const, value: 5 }) }),
    tier2: Object.freeze({ name: '大部族の誇り', description: '仲間ATK+12 + 仲間HP+15', effect: Object.freeze({ type: 'compound' as const, effects: Object.freeze([Object.freeze({ type: 'ally_bonus' as const, stat: 'atk' as const, value: 12 }), Object.freeze({ type: 'ally_bonus' as const, stat: 'hp' as const, value: 15 })]) }) }),
  }),
  Object.freeze({
    tag: 'wild' as const,
    tier1: Object.freeze({ name: '野生の勘', description: '会心率+5', effect: Object.freeze({ type: 'stat_bonus' as const, stat: 'cr' as const, value: 5 }) }),
    tier2: Object.freeze({ name: '獣の覚醒', description: '会心率+12 + ATK+10', effect: Object.freeze({ type: 'compound' as const, effects: Object.freeze([Object.freeze({ type: 'stat_bonus' as const, stat: 'cr' as const, value: 12 }), Object.freeze({ type: 'stat_bonus' as const, stat: 'atk' as const, value: 10 })]) }) }),
  }),
]);

/** シナジータグ表示情報 */
export const SYNERGY_TAG_INFO: Readonly<Record<string, { ic: string; nm: string; cl: string }>> = Object.freeze({
  fire: Object.freeze({ ic: '🔥', nm: '火', cl: '#f08050' }),
  ice: Object.freeze({ ic: '🧊', nm: '氷', cl: '#50c8e8' }),
  regen: Object.freeze({ ic: '♻️', nm: '再生', cl: '#50e090' }),
  shield: Object.freeze({ ic: '🛡️', nm: '盾', cl: '#50c8e8' }),
  hunt: Object.freeze({ ic: '🏹', nm: '狩り', cl: '#f0c040' }),
  spirit: Object.freeze({ ic: '👻', nm: '霊', cl: '#d060ff' }),
  tribe: Object.freeze({ ic: '🏕️', nm: '部族', cl: '#e0c060' }),
  wild: Object.freeze({ ic: '🐾', nm: '野生', cl: '#c0a040' }),
});
