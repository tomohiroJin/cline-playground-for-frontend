/**
 * UI表示関連の定数
 */
import type { CivType, CivTypeExt, TreeBonus } from '../types';

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

/** ログカラーマッピング */
export const LOG_COLORS: Readonly<Record<string, string>> = Object.freeze({
  gc: '#f0c040', xc: '#f05050', tc: '#f08050',
  lc: '#50e090', rc: '#d060ff', cc: '#50c8e8',
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
  Object.freeze({ k: 'rv' as const, f: (_v: number) => '復活' }),
  Object.freeze({ k: 'iR' as const, f: (v: number) => '氷耐' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'fR' as const, f: (v: number) => '火耐' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'aS' as const, f: (v: number) => '仲間枠+' + v }),
  Object.freeze({ k: 'aH' as const, f: (v: number) => '仲間HP+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'aA' as const, f: (v: number) => '仲間ATK+' + (v * 100).toFixed(0) + '%' }),
  Object.freeze({ k: 'eN' as const, f: (v: number) => '進化択+' + v }),
  Object.freeze({ k: 'sC' as const, f: (v: number) => '初期Lv+' + v }),
]);

/** ツリーボーナスデフォルト値 */
export const TB_DEFAULTS: Readonly<TreeBonus> = Object.freeze({
  bA: 0, bH: 0, bD: 0, rr: 0, bM: 0, iR: 0, fR: 0,
  aH: 0, aA: 0, cr: 0, sC: 0, rg: 0, rv: 0, aS: 0,
  eN: 0, fQ: 0, dM: 0, aQ: 0, rP: 0,
});

/** ツリーボーナスキーからカテゴリカラーへのマッピング */
export const TB_KEY_COLOR: Readonly<Record<keyof TreeBonus, string>> = Object.freeze({
  bA: CAT_CL.atk, bH: CAT_CL.hp, bD: CAT_CL.def,
  cr: CAT_CL.crit, bM: CAT_CL.bone, dM: CAT_CL.atk,
  rg: CAT_CL.hp, rv: CAT_CL.spc, iR: CAT_CL.env,
  fR: CAT_CL.env, aS: CAT_CL.ally, aH: CAT_CL.ally,
  aA: CAT_CL.ally, eN: CAT_CL.spc, sC: CAT_CL.spc,
  rr: CAT_CL.hp, fQ: CAT_CL.spc, aQ: CAT_CL.ally, rP: CAT_CL.spc,
});
