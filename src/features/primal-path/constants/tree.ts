/**
 * 文明ツリー関連の定数
 */
import type { TreeNode } from '../types';

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
