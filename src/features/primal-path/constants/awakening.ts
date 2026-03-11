/**
 * 覚醒関連の定数
 */
import type { CivTypeExt, AwakeningInfo } from '../types';

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
