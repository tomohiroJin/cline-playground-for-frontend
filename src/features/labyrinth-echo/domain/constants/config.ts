/**
 * 迷宮の残響 - ゲーム設定定数
 *
 * ゲーム全体の基本設定値を定義する。
 */

/** ゲーム基本設定 */
export const CFG = Object.freeze({
  EVENTS_PER_FLOOR: 3,
  MAX_FLOOR: 5,
  BASE_HP: 55,
  BASE_MN: 35,
  BASE_INF: 5,
  BOSS_EVENT_ID: "e030",
  MAX_BOSS_RETRIES: 3,
  /** ステータスフラグ: 追加プレフィックス */
  STATUS_FLAG_ADD_PREFIX: 'add:',
  /** ステータスフラグ: 除去プレフィックス */
  STATUS_FLAG_REMOVE_PREFIX: 'remove:',
  /** ステータスフラグ: チェインプレフィックス */
  STATUS_FLAG_CHAIN_PREFIX: 'chain:',

  // 戦闘計算設定
  /** 呪い状態での情報値ペナルティ倍率 */
  CURSE_INFO_PENALTY: 0.5,
  /** 出血ダメージ軽減倍率 */
  BLEED_REDUCE_MULT: 0.5,
  /** bigDmg 判定のHP閾値（この値より小さい場合 bigDmg） */
  IMPACT_BIG_DMG_HP: -15,
  /** dmg 判定のMN閾値（この値より小さい場合 dmg） */
  IMPACT_DMG_MN: -10,
  /** SecondLife 回復率（最大HPの何割で回復するか） */
  SECOND_LIFE_RECOVER_RATE: 0.5,

  // 条件評価設定
  /** dangerSense が発動する HP 閾値（この値未満で発動） */
  DANGER_SENSE_HP_THRESHOLD: 30,
  /** dangerSense による HP ボーナス値 */
  DANGER_SENSE_HP_BOOST: 20,
  /** negotiator による MN ボーナス値 */
  NEGOTIATOR_MN_BOOST: 8,
  /** mentalSense が発動する MN 閾値（この値未満で発動） */
  MENTAL_SENSE_MN_THRESHOLD: 25,
  /** mentalSense による MN ボーナス値 */
  MENTAL_SENSE_MN_BOOST: 15,

  // エンディング判定設定
  /** perfect エンディング: HP/MN の最低比率 */
  ENDING_PERFECT_STAT_RATIO: 0.7,
  /** perfect エンディング: 最低情報値 */
  ENDING_PERFECT_INF_MIN: 35,
  /** scholar エンディング: 最低情報値 */
  ENDING_SCHOLAR_INF_MIN: 40,
  /** iron エンディング: HP の最低比率 */
  ENDING_IRON_HP_RATIO: 0.5,
  /** battered エンディング: HP の最高比率（この値以下で該当） */
  ENDING_BATTERED_HP_RATIO: 0.25,
  /** madness エンディング: MN の最高比率（この値以下で該当） */
  ENDING_MADNESS_MN_RATIO: 0.25,
  /** veteran エンディング: 最低ログ数 */
  ENDING_VETERAN_LOG_MIN: 13,
});

// FRESH_META は models/meta-state.ts で定義（DRY の単一ソース）
export { FRESH_META } from '../models/meta-state';
