/**
 * 原始進化録 - PRIMAL PATH - ゲームデータ定数
 */
import type {
  Difficulty, Evolution, AllyTemplate, EnemyTemplate, TreeNode,
  BiomeInfo, SfxDef, CivType, CivTypeExt, BiomeId, BgmType, BgmPattern, AwakeningInfo,
  TreeBonus, SpeedOption, EnvDmgConfig, SaveData, ASkillDef, SynergyBonusDef,
  RandomEventDef, AchievementDef, ChallengeDef,
} from './types';

/** 文明タイプ一覧 */
export const CIV_TYPES: readonly CivType[] = Object.freeze(['tech', 'life', 'rit']);

/** 文明キーマッピング */
export const CIV_KEYS: Readonly<Record<CivType, 'cT' | 'cL' | 'cR'>> = Object.freeze({
  tech: 'cT', life: 'cL', rit: 'cR',
});

/** 文明カラー */
export const TC: Readonly<Record<CivTypeExt, string>> = Object.freeze({
  tech: '#f08050', life: '#50e090', rit: '#d060ff', bal: '#e0c060',
});

/** 文明名 */
export const TN: Readonly<Record<CivTypeExt, string>> = Object.freeze({
  tech: '技術', life: '生活', rit: '儀式', bal: '調和',
});

/** カテゴリカラー */
export const CAT_CL: Readonly<Record<string, string>> = Object.freeze({
  atk: '#f08050', hp: '#50e090', def: '#50c8e8', crit: '#f0c040',
  bone: '#c0a040', ally: '#d060ff', env: '#80b0c0', spc: '#f0c040',
});

/** バイオーム情報 */
export const BIO: Readonly<Record<BiomeId, BiomeInfo>> = Object.freeze({
  grassland: Object.freeze({ ic: '🌿', nm: '草原', ds: 'バランス型' }),
  glacier: Object.freeze({ ic: '❄️', nm: '氷河', ds: '技術有利' }),
  volcano: Object.freeze({ ic: '🌋', nm: '火山', ds: '儀式有利' }),
});

/** 速度オプション */
export const SPEED_OPTS: readonly SpeedOption[] = Object.freeze([
  Object.freeze(['×1', 750] as const),
  Object.freeze(['×2', 400] as const),
  Object.freeze(['×4', 200] as const),
  Object.freeze(['×8', 100] as const),
]);

/** 難易度一覧 */
export const DIFFS: readonly Difficulty[] = Object.freeze([
  Object.freeze({ n: '原始', d: '通常難易度', env: 1, bm: 1, ul: 0, ic: '🌿', hm: 1, am: 1 }),
  Object.freeze({ n: '氷河期', d: '環境ダメ強化 骨+25%', env: 1.6, bm: 1.25, ul: 1, ic: '❄️', hm: 1.7, am: 1.5 }),
  Object.freeze({ n: '大災厄', d: '敵大幅強化 骨+50%', env: 2.2, bm: 1.5, ul: 3, ic: '🔥', hm: 2.8, am: 2.4 }),
  Object.freeze({ n: '神話世界', d: '極限 ボス2連戦 骨+80%', env: 3, bm: 1.8, ul: 6, ic: '⚡', hm: 4.0, am: 3.2 }),
]);

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

/** 味方テンプレート */
export const ALT: Readonly<Record<CivType, readonly AllyTemplate[]>> = Object.freeze({
  tech: Object.freeze([
    Object.freeze({ n: '火の狩人', hp: 28, atk: 5, t: 'tech' as const }),
    Object.freeze({ n: '投石兵', hp: 22, atk: 6, t: 'tech' as const }),
  ]),
  life: Object.freeze([
    Object.freeze({ n: '回復役', hp: 32, atk: 2, t: 'life' as const, h: 1 }),
    Object.freeze({ n: '盾役', hp: 45, atk: 1, t: 'life' as const, tk: 1 }),
  ]),
  rit: Object.freeze([
    Object.freeze({ n: '狂戦士', hp: 18, atk: 9, t: 'rit' as const }),
    Object.freeze({ n: '生贄巫師', hp: 22, atk: 7, t: 'rit' as const }),
  ]),
});

/** 通常敵テンプレート */
export const ENM: Readonly<Record<BiomeId, readonly EnemyTemplate[]>> = Object.freeze({
  grassland: Object.freeze([
    Object.freeze({ n: '野ウサギ', hp: 14, atk: 3, def: 0, bone: 1 }),
    Object.freeze({ n: 'イノシシ', hp: 28, atk: 5, def: 1, bone: 1 }),
    Object.freeze({ n: 'オオカミ', hp: 35, atk: 7, def: 1, bone: 2 }),
    Object.freeze({ n: '巨大ヘビ', hp: 40, atk: 6, def: 2, bone: 2 }),
  ]),
  glacier: Object.freeze([
    Object.freeze({ n: '氷ネズミ', hp: 22, atk: 5, def: 1, bone: 1 }),
    Object.freeze({ n: '雪狼', hp: 38, atk: 8, def: 2, bone: 2 }),
    Object.freeze({ n: '氷の巨鳥', hp: 48, atk: 10, def: 2, bone: 2 }),
    Object.freeze({ n: 'フロストベア', hp: 58, atk: 12, def: 3, bone: 3 }),
  ]),
  volcano: Object.freeze([
    Object.freeze({ n: '溶岩トカゲ', hp: 26, atk: 6, def: 2, bone: 1 }),
    Object.freeze({ n: '火炎蛇', hp: 42, atk: 9, def: 1, bone: 2 }),
    Object.freeze({ n: '噴火カメ', hp: 55, atk: 8, def: 5, bone: 2 }),
    Object.freeze({ n: '灼熱ワイバーン', hp: 52, atk: 13, def: 2, bone: 3 }),
  ]),
});

/** ボステンプレート */
export const BOSS: Readonly<Record<string, EnemyTemplate>> = Object.freeze({
  grassland: Object.freeze({ n: 'サーベルタイガー', hp: 120, atk: 14, def: 3, bone: 5 }),
  glacier: Object.freeze({ n: 'マンモス', hp: 160, atk: 16, def: 6, bone: 6 }),
  volcano: Object.freeze({ n: '火竜', hp: 140, atk: 20, def: 3, bone: 6 }),
  ft: Object.freeze({ n: '氷の神獣', hp: 320, atk: 30, def: 7, bone: 10 }),
  fl: Object.freeze({ n: '大地の守護者', hp: 400, atk: 24, def: 10, bone: 10 }),
  fr: Object.freeze({ n: '血の魔神', hp: 280, atk: 40, def: 4, bone: 12 }),
});

/** 文明ツリー */
export const TREE: readonly TreeNode[] = Object.freeze([
  // Tier 1
  Object.freeze({ id: 'atk1', n: '原初の力', d: 'ATK+1', c: 15, e: Object.freeze({ bA: 1 }), t: 1, cat: 'atk' }),
  Object.freeze({ id: 'hp1', n: '厚い毛皮', d: 'HP+10', c: 15, e: Object.freeze({ bH: 10 }), t: 1, cat: 'hp' }),
  Object.freeze({ id: 'def1', n: '硬い骨格', d: 'DEF+1', c: 20, e: Object.freeze({ bD: 1 }), t: 1, cat: 'def' }),
  Object.freeze({ id: 'rare1', n: '進化の記憶', d: 'レア+5%', c: 25, e: Object.freeze({ rr: 0.05 }), t: 1, cat: 'spc' }),
  Object.freeze({ id: 'bone1', n: '骨の嗅覚', d: '骨+10%', c: 30, e: Object.freeze({ bM: 0.1 }), t: 1, cat: 'bone' }),
  Object.freeze({ id: 'spd1', n: '俊足', d: '会心+3%', c: 20, e: Object.freeze({ cr: 0.03 }), t: 1, cat: 'crit' }),
  // Tier 2
  Object.freeze({ id: 'atk2', n: '石器の極意', d: 'ATK+2', c: 55, e: Object.freeze({ bA: 2 }), r: 'atk1', t: 2, cat: 'atk' }),
  Object.freeze({ id: 'hp2', n: '不屈の血', d: 'HP+20', c: 55, e: Object.freeze({ bH: 20 }), r: 'hp1', t: 2, cat: 'hp' }),
  Object.freeze({ id: 'def2', n: '岩の心臓', d: 'DEF+1', c: 60, e: Object.freeze({ bD: 1 }), r: 'def1', t: 2, cat: 'def' }),
  Object.freeze({ id: 'ice1', n: '氷耐性', d: '氷河-25%', c: 50, e: Object.freeze({ iR: 0.25 }), t: 2, cat: 'env' }),
  Object.freeze({ id: 'fire1', n: '火耐性', d: '火山-25%', c: 50, e: Object.freeze({ fR: 0.25 }), t: 2, cat: 'env' }),
  Object.freeze({ id: 'crit1', n: '急所の知識', d: '会心+5%', c: 65, e: Object.freeze({ cr: 0.05 }), r: 'spd1', t: 2, cat: 'crit' }),
  Object.freeze({ id: 'ally1', n: '族長の声', d: '仲間HP+15%', c: 70, e: Object.freeze({ aH: 0.15 }), t: 2, cat: 'ally' }),
  Object.freeze({ id: 'bone2', n: '骨の収集家', d: '骨+10%', c: 80, e: Object.freeze({ bM: 0.1 }), r: 'bone1', t: 2, cat: 'bone' }),
  Object.freeze({ id: 'env1', n: '環境適応', d: '環境ダメ-15%', c: 60, e: Object.freeze({ iR: 0.15, fR: 0.15 }), t: 2, cat: 'env' }),
  // Tier 3
  Object.freeze({ id: 'atk3', n: '猛獣の魂', d: 'ATK+3', c: 140, e: Object.freeze({ bA: 3 }), r: 'atk2', t: 3, cat: 'atk' }),
  Object.freeze({ id: 'hp3', n: '大地の加護', d: 'HP+30', c: 140, e: Object.freeze({ bH: 30 }), r: 'hp2', t: 3, cat: 'hp' }),
  Object.freeze({ id: 'crit2', n: '必殺の一撃', d: '会心+5%', c: 160, e: Object.freeze({ cr: 0.05 }), r: 'crit1', t: 3, cat: 'crit' }),
  Object.freeze({ id: 'start1', n: '文明の芽', d: '開始文明Lv1', c: 150, e: Object.freeze({ sC: 1 }), t: 3, cat: 'spc' }),
  Object.freeze({ id: 'ally2', n: '部族の絆', d: '仲間ATK+20%', c: 170, e: Object.freeze({ aA: 0.2 }), r: 'ally1', t: 3, cat: 'ally' }),
  Object.freeze({ id: 'ice2', n: '氷の支配', d: '氷河-50%', c: 180, e: Object.freeze({ iR: 0.5 }), r: 'ice1', t: 3, cat: 'env' }),
  Object.freeze({ id: 'fire2', n: '炎の支配', d: '火山-50%', c: 180, e: Object.freeze({ fR: 0.5 }), r: 'fire1', t: 3, cat: 'env' }),
  Object.freeze({ id: 'heal1', n: '再生の血', d: '毎ターンHP2%', c: 160, e: Object.freeze({ rg: 0.02 }), t: 3, cat: 'hp' }),
  Object.freeze({ id: 'rare2', n: '進化の英知', d: 'レア+8%', c: 190, e: Object.freeze({ rr: 0.08 }), r: 'rare1', t: 3, cat: 'spc' }),
  Object.freeze({ id: 'dmg1', n: '闘志', d: '全ダメ+8%', c: 180, e: Object.freeze({ dM: 0.08 }), t: 3, cat: 'atk' }),
  // Tier 4
  Object.freeze({ id: 'atk4', n: '破壊神の拳', d: 'ATK+5', c: 350, e: Object.freeze({ bA: 5 }), r: 'atk3', t: 4, cat: 'atk' }),
  Object.freeze({ id: 'hp4', n: '不死の体', d: 'HP+50', c: 350, e: Object.freeze({ bH: 50 }), r: 'hp3', t: 4, cat: 'hp' }),
  Object.freeze({ id: 'start2', n: '古代の知恵', d: '開始文明Lv2', c: 450, e: Object.freeze({ sC: 1 }), r: 'start1', t: 4, cat: 'spc' }),
  Object.freeze({ id: 'bone3', n: '骨の王', d: '骨+15%', c: 400, e: Object.freeze({ bM: 0.15 }), r: 'bone2', t: 4, cat: 'bone' }),
  Object.freeze({ id: 'rev1', n: '復活の儀', d: '死亡時復活', c: 500, e: Object.freeze({ rv: 1 }), t: 4, cat: 'spc' }),
  Object.freeze({ id: 'ally3', n: '大族長', d: '仲間枠+1', c: 450, e: Object.freeze({ aS: 1 }), r: 'ally2', t: 4, cat: 'ally' }),
  Object.freeze({ id: 'luck1', n: '運命の導き', d: '進化4択', c: 400, e: Object.freeze({ eN: 1 }), t: 4, cat: 'spc' }),
  Object.freeze({ id: 'crit3', n: '達人の目', d: '会心+8%', c: 380, e: Object.freeze({ cr: 0.08 }), r: 'crit2', t: 4, cat: 'crit' }),
  Object.freeze({ id: 'def3', n: '鉄壁', d: 'DEF+3', c: 400, e: Object.freeze({ bD: 3 }), r: 'def2', t: 4, cat: 'def' }),
  Object.freeze({ id: 'heal2', n: '生命力強化', d: '毎ターンHP3%', c: 420, e: Object.freeze({ rg: 0.03 }), r: 'heal1', t: 4, cat: 'hp' }),
  // Tier 5
  Object.freeze({ id: 'final1', n: '進化の頂点', d: '大覚醒Lv4に緩和', c: 800, e: Object.freeze({ fQ: -1 }), t: 5, cat: 'spc' }),
  Object.freeze({ id: 'atk5', n: '始祖の力', d: '全ダメ+15%', c: 900, e: Object.freeze({ dM: 0.15 }), r: 'dmg1', t: 5, cat: 'atk' }),
  Object.freeze({ id: 'hp5', n: '永遠の命', d: 'HP+80', c: 900, e: Object.freeze({ bH: 80 }), r: 'hp4', t: 5, cat: 'hp' }),
  Object.freeze({ id: 'bone4', n: '黄金の骨', d: '骨+25%', c: 1000, e: Object.freeze({ bM: 0.25 }), r: 'bone3', t: 5, cat: 'bone' }),
  Object.freeze({ id: 'ally4', n: '伝説の族長', d: '仲間ATK+30%', c: 1200, e: Object.freeze({ aA: 0.3 }), r: 'ally3', t: 5, cat: 'ally' }),
  Object.freeze({ id: 'awk1', n: '覚醒の素質', d: '小覚醒Lv3に緩和', c: 700, e: Object.freeze({ aQ: -1 }), t: 5, cat: 'spc' }),
  // Tier 6
  Object.freeze({ id: 'atk6', n: '天破の拳', d: 'ATK+8', c: 1500, e: Object.freeze({ bA: 8 }), r: 'atk4', t: 6, cat: 'atk' }),
  Object.freeze({ id: 'hp6', n: '世界樹の命', d: 'HP+120', c: 1500, e: Object.freeze({ bH: 120 }), r: 'hp5', t: 6, cat: 'hp' }),
  Object.freeze({ id: 'crit4', n: '神眼', d: '会心+12%', c: 1400, e: Object.freeze({ cr: 0.12 }), r: 'crit3', t: 6, cat: 'crit' }),
  Object.freeze({ id: 'rev2', n: '輪廻転生', d: '復活HP50%', c: 1800, e: Object.freeze({ rP: 0.2 }), r: 'rev1', t: 6, cat: 'spc' }),
  Object.freeze({ id: 'bone5', n: '骨神の加護', d: '骨+35%', c: 1600, e: Object.freeze({ bM: 0.35 }), r: 'bone4', t: 6, cat: 'bone' }),
  Object.freeze({ id: 'dmg2', n: '破壊衝動', d: '全ダメ+20%', c: 1700, e: Object.freeze({ dM: 0.2 }), r: 'atk5', t: 6, cat: 'atk' }),
  Object.freeze({ id: 'start3', n: '太古の記憶', d: '開始文明Lv3', c: 2000, e: Object.freeze({ sC: 1 }), r: 'start2', t: 6, cat: 'spc' }),
  // Tier 7
  Object.freeze({ id: 'atk7', n: '原始神の怒り', d: 'ATK+12', c: 3000, e: Object.freeze({ bA: 12 }), r: 'atk6', t: 7, cat: 'atk' }),
  Object.freeze({ id: 'hp7', n: '不滅の魂', d: 'HP+200', c: 3000, e: Object.freeze({ bH: 200 }), r: 'hp6', t: 7, cat: 'hp' }),
  Object.freeze({ id: 'ally5', n: '神族の長', d: '仲間枠+1 仲間ATK+40%', c: 3500, e: Object.freeze({ aS: 1, aA: 0.4 }), r: 'ally4', t: 7, cat: 'ally' }),
  Object.freeze({ id: 'luck2', n: '天命', d: '進化5択', c: 2800, e: Object.freeze({ eN: 1 }), r: 'luck1', t: 7, cat: 'spc' }),
  Object.freeze({ id: 'def4', n: '絶対防御', d: 'DEF+6', c: 2500, e: Object.freeze({ bD: 6 }), r: 'def3', t: 7, cat: 'def' }),
  Object.freeze({ id: 'heal3', n: '永劫回帰', d: '毎ターンHP5%', c: 3200, e: Object.freeze({ rg: 0.05 }), r: 'heal2', t: 7, cat: 'hp' }),
  // Tier 8
  Object.freeze({ id: 'atk8', n: '万物破壊', d: 'ATK+20 全ダメ+25%', c: 5000, e: Object.freeze({ bA: 20, dM: 0.25 }), r: 'atk7', t: 8, cat: 'atk' }),
  Object.freeze({ id: 'hp8', n: '始原の器', d: 'HP+350', c: 5000, e: Object.freeze({ bH: 350 }), r: 'hp7', t: 8, cat: 'hp' }),
  Object.freeze({ id: 'bone6', n: '骨の創世神', d: '骨+50%', c: 6000, e: Object.freeze({ bM: 0.5 }), r: 'bone5', t: 8, cat: 'bone' }),
  Object.freeze({ id: 'final2', n: '究極覚醒', d: '大覚醒Lv3に緩和', c: 8000, e: Object.freeze({ fQ: -1 }), t: 8, cat: 'spc' }),
]);

/** ティアアンロック条件 (クリア回数) */
export const TIER_UNLOCK: Readonly<Record<number, number>> = Object.freeze({
  1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 3, 7: 6, 8: 10,
});

/** ティア名 */
export const TIER_NAMES: Readonly<Record<number, string>> = Object.freeze({
  1: 'Tier1 基礎', 2: 'Tier2 応用', 3: 'Tier3 上級', 4: 'Tier4 極意',
  5: 'Tier5 伝説', 6: 'Tier6 神話', 7: 'Tier7 超越', 8: 'Tier8 究極',
});

/** 小覚醒データ */
export const AWK_SA: Readonly<Record<CivTypeExt, AwakeningInfo>> = Object.freeze({
  tech: Object.freeze({ nm: '炎の目覚め', ds: 'ATK+5 火傷付与', cl: '#f08050', fx: Object.freeze({ atk: 5, burn: 1 }) }),
  life: Object.freeze({ nm: '森の息吹', ds: 'HP+20 DEF+2', cl: '#50e090', fx: Object.freeze({ mhp: 20, def: 2 }) }),
  rit: Object.freeze({ nm: '血の胎動', ds: 'ATK+8 HP-10', cl: '#d060ff', fx: Object.freeze({ atk: 8, sd: 10 }) }),
  bal: Object.freeze({ nm: '調和の芽生え', ds: 'ATK+3 HP+15 DEF+1', cl: '#e0c060', fx: Object.freeze({ atk: 3, mhp: 15, def: 1 }) }),
});

/** 大覚醒データ */
export const AWK_FA: Readonly<Record<CivTypeExt, AwakeningInfo>> = Object.freeze({
  tech: Object.freeze({ nm: '炎王の始祖', ds: '全攻撃に炎。氷河無効。', bn: 'ATK+15 火傷 氷河無効', cl: '#f08050', fx: Object.freeze({ atk: 15, burn: 1 }) }),
  life: Object.freeze({ nm: '大部族の長', ds: '圧倒的耐久と仲間強化。', bn: 'HP+50 DEF+5 仲間ATK×2', cl: '#50e090', fx: Object.freeze({ mhp: 50, def: 5, allyAtkMul: 2 }) }),
  rit: Object.freeze({ nm: '血の神託者', ds: '瀕死で覚醒し敵を圧倒。', bn: '低HP ATK×3 骨+10 DEF+2', cl: '#d060ff', fx: Object.freeze({ def: 2, bb: 10 }) }),
  bal: Object.freeze({ nm: '万象の統率者', ds: '全能力上昇。仲間全回復。', bn: 'ATK+8 HP+40 DEF+4 仲間全回復', cl: '#e0c060', fx: Object.freeze({ atk: 8, mhp: 40, def: 4, allyFullHeal: 1 }) }),
});

/** バイオーム相性 */
export const BIOME_AFFINITY: Readonly<Record<BiomeId, { check: (l: { tech: number; life: number; rit: number }) => boolean; m: number }>> = Object.freeze({
  glacier: Object.freeze({ check: (l: { tech: number; life: number; rit: number }) => l.tech > l.life && l.tech > l.rit, m: 1.3 }),
  volcano: Object.freeze({ check: (l: { tech: number; life: number; rit: number }) => l.rit > l.life && l.rit > l.tech, m: 1.3 }),
  grassland: Object.freeze({ check: (l: { tech: number; life: number; rit: number }) => l.life > l.tech && l.life > l.rit, m: 1.2 }),
});

/** 環境ダメージ設定 */
export const ENV_DMG: Readonly<Record<string, EnvDmgConfig>> = Object.freeze({
  glacier: Object.freeze({ base: 3, resist: 'iR' as const, immune: 'tech' as const, icon: '❄️ 寒さ', c: 'cc' }),
  volcano: Object.freeze({ base: 2, resist: 'fR' as const, immune: null, icon: '🌋 灼熱', c: 'tc' }),
});

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
});

/** ツリーボーナスサマリー定義 */
export const TB_SUMMARY: readonly { k: keyof TreeBonus; f: (v: number) => string }[] = Object.freeze([
  Object.freeze({ k: 'bA' as const, f: (v: number) => 'ATK+' + v }),
  Object.freeze({ k: 'bH' as const, f: (v: number) => 'HP+' + v }),
  Object.freeze({ k: 'bD' as const, f: (v: number) => 'DEF+' + v }),
  Object.freeze({ k: 'cr' as const, f: (v: number) => '会心+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'bM' as const, f: (v: number) => '骨+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'dM' as const, f: (v: number) => 'ダメ+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'rg' as const, f: (v: number) => '再生+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'rv' as const, f: (v: number) => '復活' }),
  Object.freeze({ k: 'iR' as const, f: (v: number) => '氷耐' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'fR' as const, f: (v: number) => '火耐' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'aS' as const, f: (v: number) => '仲間枠+' + v }),
  Object.freeze({ k: 'aH' as const, f: (v: number) => '仲間HP+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'aA' as const, f: (v: number) => '仲間ATK+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'eN' as const, f: (v: number) => '進化択+' + v }),
  Object.freeze({ k: 'sC' as const, f: (v: number) => '初期Lv+' + v }),
]);

/** ログカラーマッピング */
export const LOG_COLORS: Readonly<Record<string, string>> = Object.freeze({
  gc: '#f0c040', xc: '#f05050', tc: '#f08050',
  lc: '#50e090', rc: '#d060ff', cc: '#50c8e8',
});

/** 敵カラーマッピング */
export const ENEMY_COLORS: Readonly<Record<string, string>> = Object.freeze({
  '野ウサギ': '#c0a060', 'イノシシ': '#806040', 'オオカミ': '#707880',
  '巨大ヘビ': '#4a804a', '氷ネズミ': '#80c0d0', '雪狼': '#b0c0d0',
  '氷の巨鳥': '#90c0e0', 'フロストベア': '#c0d8e8', '溶岩トカゲ': '#e06040',
  '火炎蛇': '#e08040', '噴火カメ': '#b06040', '灼熱ワイバーン': '#e04040',
  'サーベルタイガー': '#e0b040', 'マンモス': '#a08060', '火竜': '#e02020',
  '氷の神獣': '#50b0e0', '大地の守護者': '#40a040', '血の魔神': '#c02060',
});

/** 敵詳細パーツ (大型) */
export const ENEMY_DETAILS: readonly { match: string; parts: readonly (readonly [number, number, number, number, string | null])[] }[] = Object.freeze([
  Object.freeze({ match: 'マンモス', parts: Object.freeze([Object.freeze([6, 12, 3, 10, '#c0b090'] as const), Object.freeze([4, 20, 3, 3, '#c0b090'] as const)]) }),
  Object.freeze({ match: '竜', parts: Object.freeze([Object.freeze([0, 4, 5, 8, null] as const), Object.freeze([19, 4, 5, 8, null] as const)]) }),
  Object.freeze({ match: '魔神', parts: Object.freeze([Object.freeze([0, 4, 5, 8, null] as const), Object.freeze([19, 4, 5, 8, null] as const)]) }),
  Object.freeze({ match: '神獣', parts: Object.freeze([Object.freeze([8, 0, 2, 3, '#fff'] as const), Object.freeze([14, 0, 2, 3, '#fff'] as const)]) }),
  Object.freeze({ match: '守護者', parts: Object.freeze([Object.freeze([2, 0, 4, 4, '#60c060'] as const), Object.freeze([18, 0, 4, 4, '#60c060'] as const)]) }),
  Object.freeze({ match: 'タイガー', parts: Object.freeze([Object.freeze([6, 10, 2, 4, '#fff'] as const), Object.freeze([16, 10, 2, 4, '#fff'] as const)]) }),
]);

/** 敵詳細パーツ (小型) */
export const ENEMY_SMALL_DETAILS: readonly { match: string; parts: readonly (readonly [number, number, number, number, string | null])[] }[] = Object.freeze([
  Object.freeze({ match: '鳥', parts: Object.freeze([Object.freeze([2, 0, 3, 6, null] as const), Object.freeze([11, 0, 3, 6, null] as const)]) }),
  Object.freeze({ match: 'ヘビ', parts: Object.freeze([Object.freeze([3, 8, 10, 2, null] as const), Object.freeze([12, 6, 3, 3, null] as const)]) }),
  Object.freeze({ match: '蛇', parts: Object.freeze([Object.freeze([3, 8, 10, 2, null] as const), Object.freeze([12, 6, 3, 3, null] as const)]) }),
  Object.freeze({ match: 'ベア', parts: Object.freeze([Object.freeze([4, 0, 2, 2, null] as const), Object.freeze([10, 0, 2, 2, null] as const)]) }),
]);

/** ツリーボーナスデフォルト値 */
export const TB_DEFAULTS: Readonly<TreeBonus> = Object.freeze({
  bA: 0, bH: 0, bD: 0, rr: 0, bM: 0, iR: 0, fR: 0,
  aH: 0, aA: 0, cr: 0, sC: 0, rg: 0, rv: 0, aS: 0,
  eN: 0, fQ: 0, dM: 0, aQ: 0, rP: 0,
});

/** 初期セーブデータ */
export const FRESH_SAVE: Readonly<SaveData> = Object.freeze({
  bones: 0,
  tree: Object.freeze({}),
  clears: 0,
  runs: 0,
  best: Object.freeze({}),
});

/** localStorage キー */
export const SAVE_KEY = 'primal-path-v7';

/** Waves per biome */
export const WAVES_PER_BIOME = 4;

/** バイオーム数 */
export const BIOME_COUNT = 3;

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

/* ===== ランダムイベント ===== */

/** イベント発生確率（30%） */
export const EVENT_CHANCE = 0.3;

/** イベント発生不可の最低バトル数（序盤を除外） */
export const EVENT_MIN_BATTLES = 1;

/** ランダムイベント定義（8種） */
export const RANDOM_EVENTS: readonly RandomEventDef[] = Object.freeze([
  Object.freeze({
    id: 'bone_merchant' as const,
    name: '骨の商人',
    description: '奇妙な商人が骨と引き換えに力を分けてくれるという。',
    situationText: '取引に応じるか？',
    choices: Object.freeze([
      Object.freeze({ label: '骨30で取引する', description: '骨を消費してATK+8を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 8 }), riskLevel: 'safe' as const, cost: Object.freeze({ type: 'bone' as const, amount: 30 }) }),
      Object.freeze({ label: '骨50で大取引する', description: '骨を多く消費して大きな力を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 18 }), riskLevel: 'risky' as const, cost: Object.freeze({ type: 'bone' as const, amount: 50 }) }),
      Object.freeze({ label: '立ち去る', description: '何も起こらない', effect: Object.freeze({ type: 'nothing' as const }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'ancient_shrine' as const,
    name: '古代の祠',
    description: '苔むした祠から微かな光が漏れている。祈りを捧げるか？',
    situationText: '神秘的な力を感じる…',
    choices: Object.freeze([
      Object.freeze({ label: '祈りを捧げる', description: '最もレベルの高い文明が1上がる', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'dominant' as const }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '祠を調べる', description: 'ランダムな進化を得るかもしれない', effect: Object.freeze({ type: 'random_evolution' as const }), riskLevel: 'risky' as const }),
      Object.freeze({ label: '通り過ぎる', description: '何も起こらない', effect: Object.freeze({ type: 'nothing' as const }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'lost_ally' as const,
    name: '迷い仲間',
    description: '傷ついた仲間が助けを求めている。助けるには体力を消耗するが…',
    situationText: 'どうする？',
    choices: Object.freeze([
      Object.freeze({ label: '助ける', description: '仲間が加入するがHP-15のダメージを受ける', effect: Object.freeze({ type: 'add_ally' as const, allyTemplate: 'random' }), riskLevel: 'risky' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 15 }) }),
      Object.freeze({ label: '立ち去る', description: '見捨てた罪悪感…骨を10拾う', effect: Object.freeze({ type: 'bone_change' as const, amount: 10 }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'poison_swamp' as const,
    name: '毒沼',
    description: '足元に毒々しい沼が広がっている。突っ切るか迂回するか…',
    situationText: '危険な道を選ぶか？',
    choices: Object.freeze([
      Object.freeze({ label: '突っ切る', description: 'HP-20ダメージを受けるがATK+5を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 5 }), riskLevel: 'dangerous' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 20 }) }),
      Object.freeze({ label: '迂回して薬草を探す', description: 'HPを回復できるかもしれない', effect: Object.freeze({ type: 'heal' as const, amount: 15 }), riskLevel: 'safe' as const }),
    ]),
    biomeAffinity: Object.freeze(['grassland' as const]),
  }),
  Object.freeze({
    id: 'mystery_fossil' as const,
    name: '謎の化石',
    description: '地面に埋まった巨大な化石を発見した。',
    situationText: 'どう活用する？',
    choices: Object.freeze([
      Object.freeze({ label: '掘り出す', description: 'DEFが上がるかもしれない', effect: Object.freeze({ type: 'stat_change' as const, stat: 'def' as const, value: 5 }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '骨として持ち帰る', description: '骨を入手する', effect: Object.freeze({ type: 'bone_change' as const, amount: 20 }), riskLevel: 'safe' as const }),
    ]),
  }),
  Object.freeze({
    id: 'beast_den' as const,
    name: '獣の巣穴',
    description: '巨大な獣の巣穴を見つけた。中に何かありそうだが…',
    situationText: '危険を冒すか？',
    choices: Object.freeze([
      Object.freeze({ label: '探索する', description: 'HP-20ダメージを受けるがATK+12を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'atk' as const, value: 12 }), riskLevel: 'dangerous' as const, cost: Object.freeze({ type: 'hp_damage' as const, amount: 20 }) }),
      Object.freeze({ label: '見なかったことにする', description: '安全に立ち去り、DEF+2を得る', effect: Object.freeze({ type: 'stat_change' as const, stat: 'def' as const, value: 2 }), riskLevel: 'safe' as const }),
    ]),
    biomeAffinity: Object.freeze(['volcano' as const]),
  }),
  Object.freeze({
    id: 'starry_night' as const,
    name: '星降る夜',
    description: '空一面の星明かりの下、不思議な力が身体を包む。',
    situationText: '星の力をどう使う？',
    choices: Object.freeze([
      Object.freeze({ label: '瞑想する', description: 'HPを回復する', effect: Object.freeze({ type: 'heal' as const, amount: 25 }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '星に願いをかける', description: 'ランダムな進化を得る', effect: Object.freeze({ type: 'random_evolution' as const }), riskLevel: 'risky' as const }),
    ]),
  }),
  Object.freeze({
    id: 'cave_painting' as const,
    name: '古代の壁画',
    description: '洞窟の壁に文明の記録が描かれている。',
    situationText: 'どの壁画を読み解く？',
    choices: Object.freeze([
      Object.freeze({ label: '技術の壁画を読む', description: '技術レベル+1', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'tech' as const }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '生活の壁画を読む', description: '生活レベル+1', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'life' as const }), riskLevel: 'safe' as const }),
      Object.freeze({ label: '儀式の壁画を読む', description: '儀式レベル+1', effect: Object.freeze({ type: 'civ_level_up' as const, civType: 'rit' as const }), riskLevel: 'safe' as const }),
    ]),
    biomeAffinity: Object.freeze(['glacier' as const]),
  }),
]);

/* ===== メタ進行・実績 (Phase 4) ===== */

/** ラン統計ストレージキー */
export const STATS_KEY = 'primal-path-stats';

/** 実績ストレージキー */
export const ACHIEVEMENTS_KEY = 'primal-path-achievements';

/** 累計統計ストレージキー */
export const AGGREGATE_KEY = 'primal-path-aggregate';

/** ラン統計保持上限 */
export const MAX_RUN_STATS = 50;

/** BGM パターン定義（バイオーム別ペンタトニックスケール） */
export const BGM_PATTERNS: Readonly<Record<BgmType, BgmPattern>> = Object.freeze({
  title: Object.freeze({
    notes: Object.freeze([262, 294, 330, 392, 440, 392, 330, 294]),
    tempo: 400,
    wave: 'triangle' as const,
    gain: 0.04,
  }),
  grassland: Object.freeze({
    notes: Object.freeze([330, 392, 440, 523, 440, 392, 330, 294]),
    tempo: 350,
    wave: 'sine' as const,
    gain: 0.04,
  }),
  glacier: Object.freeze({
    notes: Object.freeze([262, 330, 392, 330, 262, 220, 262, 330]),
    tempo: 500,
    wave: 'triangle' as const,
    gain: 0.03,
  }),
  volcano: Object.freeze({
    notes: Object.freeze([196, 262, 294, 392, 294, 262, 196, 165]),
    tempo: 300,
    wave: 'sawtooth' as const,
    gain: 0.03,
  }),
});

/** 音量設定 localStorage キー */
export const VOLUME_KEY = 'primal-path-volume';

/** 実績定義（15個） */
export const ACHIEVEMENTS: readonly AchievementDef[] = Object.freeze([
  Object.freeze({
    id: 'first_clear',
    name: '原始の証',
    description: '初めてゲームをクリアする',
    icon: '🦴',
    condition: Object.freeze({ type: 'first_clear' as const }),
  }),
  Object.freeze({
    id: 'clear_10',
    name: '歴戦の狩人',
    description: '10回クリアする',
    icon: '🏹',
    condition: Object.freeze({ type: 'clear_count' as const, count: 10 }),
  }),
  Object.freeze({
    id: 'clear_hard',
    name: '氷河期の生存者',
    description: '難易度「氷河期」をクリアする',
    icon: '❄️',
    condition: Object.freeze({ type: 'clear_difficulty' as const, difficulty: 1 }),
  }),
  Object.freeze({
    id: 'clear_nightmare',
    name: '大災厄を越えし者',
    description: '難易度「大災厄」をクリアする',
    icon: '🌋',
    condition: Object.freeze({ type: 'clear_difficulty' as const, difficulty: 2 }),
  }),
  Object.freeze({
    id: 'clear_myth',
    name: '神話の刻印者',
    description: '難易度「神話世界」をクリアする',
    icon: '⚡',
    condition: Object.freeze({ type: 'clear_difficulty' as const, difficulty: 3 }),
  }),
  Object.freeze({
    id: 'all_difficulties',
    name: '全知全能',
    description: '全難易度をクリアする',
    icon: '👑',
    condition: Object.freeze({ type: 'all_difficulties_cleared' as const }),
  }),
  Object.freeze({
    id: 'all_awakenings',
    name: '覚醒の極み',
    description: '全種類の覚醒を達成する',
    icon: '✨',
    condition: Object.freeze({ type: 'all_awakenings' as const }),
  }),
  Object.freeze({
    id: 'big_damage',
    name: '原始の一撃',
    description: '1回の攻撃で100ダメージを与える',
    icon: '💥',
    condition: Object.freeze({ type: 'max_damage' as const, threshold: 100 }),
  }),
  Object.freeze({
    id: 'mass_slayer',
    name: '百獣の王',
    description: '累計100体の敵を撃破する',
    icon: '🦁',
    condition: Object.freeze({ type: 'total_kills' as const, count: 100 }),
  }),
  Object.freeze({
    id: 'fire_master',
    name: '炎のシナジーマスター',
    description: '「火」シナジーTier2を発動する',
    icon: '🔥',
    condition: Object.freeze({ type: 'synergy_tier2' as const, tag: 'fire' as const }),
  }),
  Object.freeze({
    id: 'all_synergies',
    name: 'シナジーコレクター',
    description: '全シナジーのTier1を発動する',
    icon: '🧬',
    condition: Object.freeze({ type: 'all_synergies_tier1' as const }),
  }),
  Object.freeze({
    id: 'event_explorer',
    name: '好奇心旺盛',
    description: '累計10回イベントに遭遇する',
    icon: '🗺️',
    condition: Object.freeze({ type: 'event_count' as const, count: 10 }),
  }),
  Object.freeze({
    id: 'speed_runner',
    name: '疾風のごとく',
    description: '5分以内にクリアする',
    icon: '🏃',
    condition: Object.freeze({ type: 'speed_clear' as const, maxSeconds: 300 }),
  }),
  Object.freeze({
    id: 'bone_collector',
    name: '骨の収集家',
    description: '累計1000骨を集める',
    icon: '💀',
    condition: Object.freeze({ type: 'bone_hoarder' as const, amount: 1000 }),
  }),
  Object.freeze({
    id: 'full_tree',
    name: '文明の完成者',
    description: '文明ツリーを全解放する',
    icon: '🌳',
    condition: Object.freeze({ type: 'full_tree' as const }),
  }),
]);

/** チャレンジ定義（3種） */
export const CHALLENGES: readonly ChallengeDef[] = Object.freeze([
  Object.freeze({
    id: 'fragile',
    name: '脆き肉体',
    description: '初期HPが半分。被ダメージ+25%。克服すれば真の強者。',
    icon: '💔',
    modifiers: Object.freeze([
      Object.freeze({ type: 'hp_multiplier' as const, value: 0.5 }),
      Object.freeze({ type: 'enemy_multiplier' as const, stat: 'atk' as const, value: 1.25 }),
    ]),
  }),
  Object.freeze({
    id: 'minimalist',
    name: '原始回帰',
    description: '進化は最大5回まで。限られた選択で最善を尽くせ。',
    icon: '🪨',
    modifiers: Object.freeze([
      Object.freeze({ type: 'max_evolutions' as const, count: 5 }),
    ]),
  }),
  Object.freeze({
    id: 'time_trial',
    name: '生存競争',
    description: '10分以内にクリアせよ。時間切れは即敗北。',
    icon: '⏱️',
    modifiers: Object.freeze([
      Object.freeze({ type: 'speed_limit' as const, maxSeconds: 600 }),
    ]),
  }),
]);
