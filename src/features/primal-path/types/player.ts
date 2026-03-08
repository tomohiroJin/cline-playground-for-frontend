/**
 * プレイヤー状態の型定義
 */

/** プレイヤーの戦闘ステータス */
export interface PlayerState {
  /** 現在HP */
  hp: number;
  /** 最大HP */
  mhp: number;
  /** 攻撃力 */
  atk: number;
  /** 防御力 */
  def: number;
  /** 会心率（0〜100） */
  cr: number;
  /** 火傷ダメージ/ターン */
  burn: number;
  /** 攻撃倍率 */
  aM: number;
  /** 被ダメージ倍率 */
  dm: number;
}
