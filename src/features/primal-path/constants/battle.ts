/**
 * 戦闘関連の定数
 */
import type { EnemyTemplate, SpeedOption, BiomeId } from '../types';

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
  fa: Object.freeze({ n: '天空の裁定者', hp: 350, atk: 35, def: 8, bone: 11 }),
  fx: Object.freeze({ n: '混沌の始祖龍', hp: 450, atk: 28, def: 12, bone: 12 }),
});

/** ボス連戦スケール倍率 */
export const BOSS_CHAIN_SCALE: readonly number[] = Object.freeze([1.0, 1.15, 1.3, 1.45, 1.6]);

/** 最終ボス出現順テーブル（初回ボスキーに基づく連戦順） */
export const FINAL_BOSS_ORDER: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ft: Object.freeze(['ft', 'fl', 'fr', 'fa', 'fx']),
  fl: Object.freeze(['fl', 'fr', 'ft', 'fa', 'fx']),
  fr: Object.freeze(['fr', 'ft', 'fl', 'fa', 'fx']),
});

/** 速度オプション */
export const SPEED_OPTS: readonly SpeedOption[] = Object.freeze([
  Object.freeze(['×0.5', 1500] as const),
  Object.freeze(['×1', 750] as const),
  Object.freeze(['×2', 400] as const),
  Object.freeze(['×4', 200] as const),
  Object.freeze(['×8', 100] as const),
]);

/** Waves per biome */
export const WAVES_PER_BIOME = 4;

/** 敵カラーマッピング */
export const ENEMY_COLORS: Readonly<Record<string, string>> = Object.freeze({
  '野ウサギ': '#c0a060', 'イノシシ': '#806040', 'オオカミ': '#707880',
  '巨大ヘビ': '#4a804a', '氷ネズミ': '#80c0d0', '雪狼': '#b0c0d0',
  '氷の巨鳥': '#90c0e0', 'フロストベア': '#c0d8e8', '溶岩トカゲ': '#e06040',
  '火炎蛇': '#e08040', '噴火カメ': '#b06040', '灼熱ワイバーン': '#e04040',
  'サーベルタイガー': '#e0b040', 'マンモス': '#a08060', '火竜': '#e02020',
  '氷の神獣': '#50b0e0', '大地の守護者': '#40a040', '血の魔神': '#c02060',
  '天空の裁定者': '#e0d050', '混沌の始祖龍': '#8040c0',
});

/** 敵詳細パーツ (大型 32×32 グリッド) */
export const ENEMY_DETAILS: readonly { match: string; parts: readonly (readonly [number, number, number, number, string | null])[] }[] = Object.freeze([
  Object.freeze({ match: 'マンモス', parts: Object.freeze([Object.freeze([8, 16, 4, 14, '#c0b090'] as const), Object.freeze([5, 27, 4, 4, '#c0b090'] as const)]) }),
  Object.freeze({ match: '竜', parts: Object.freeze([Object.freeze([0, 5, 7, 11, null] as const), Object.freeze([25, 5, 7, 11, null] as const)]) }),
  Object.freeze({ match: '魔神', parts: Object.freeze([Object.freeze([0, 5, 7, 11, null] as const), Object.freeze([25, 5, 7, 11, null] as const)]) }),
  Object.freeze({ match: '神獣', parts: Object.freeze([Object.freeze([10, 0, 3, 4, '#fff'] as const), Object.freeze([19, 0, 3, 4, '#fff'] as const)]) }),
  Object.freeze({ match: '守護者', parts: Object.freeze([Object.freeze([2, 0, 6, 6, '#60c060'] as const), Object.freeze([24, 0, 6, 6, '#60c060'] as const)]) }),
  Object.freeze({ match: 'タイガー', parts: Object.freeze([Object.freeze([8, 13, 3, 6, '#fff'] as const), Object.freeze([21, 13, 3, 6, '#fff'] as const)]) }),
  Object.freeze({ match: '裁定者', parts: Object.freeze([Object.freeze([0, 5, 7, 11, null] as const), Object.freeze([25, 5, 7, 11, null] as const)]) }),
  Object.freeze({ match: '始祖龍', parts: Object.freeze([Object.freeze([0, 5, 7, 11, null] as const), Object.freeze([25, 5, 7, 11, null] as const)]) }),
]);

/** 敵詳細パーツ (小型 24×24 グリッド) */
export const ENEMY_SMALL_DETAILS: readonly { match: string; parts: readonly (readonly [number, number, number, number, string | null])[] }[] = Object.freeze([
  Object.freeze({ match: '鳥', parts: Object.freeze([Object.freeze([3, 0, 4, 9, null] as const), Object.freeze([17, 0, 4, 9, null] as const)]) }),
  Object.freeze({ match: 'ヘビ', parts: Object.freeze([Object.freeze([4, 12, 16, 3, null] as const), Object.freeze([18, 9, 4, 4, null] as const)]) }),
  Object.freeze({ match: '蛇', parts: Object.freeze([Object.freeze([4, 12, 16, 3, null] as const), Object.freeze([18, 9, 4, 4, null] as const)]) }),
  Object.freeze({ match: 'ベア', parts: Object.freeze([Object.freeze([6, 0, 3, 3, null] as const), Object.freeze([15, 0, 3, 3, null] as const)]) }),
]);
