/**
 * 灰燼の城壁 - カード型定義
 *
 * カードはデータ駆動。効果は少数のスペックの組み合わせで表現し、
 * カード追加＝データ追加にする。
 *
 * 設計原則（設計書 §7）: 最高効率のカードには必ず「効かない相手」を作る。
 * 塔は hitsFlying で適用範囲を制限し、効率差はそのまま残す。
 */

export type CardType = 'tower' | 'trap' | 'spell' | 'reactor' | 'ember';

/** タワー性能 */
export interface TowerSpec {
  /** 射程（セル距離・ユークリッド） */
  range: number;
  /** 1発のダメージ */
  damage: number;
  /** 攻撃間隔（tick） */
  cooldownTicks: number;
  /** 範囲ダメージ半径（0 = 単体攻撃） */
  splashRadius: number;
  /** 飛行敵を攻撃できるか */
  hitsFlying: boolean;
  /**
   * オーラ効果（定義されていれば攻撃せず、隣接タワーを強化する）
   *
   * 篝火は火力、鍛冶場は射程を上げる。両方を持つカードは想定していないが、
   * 型としては共存できる（加算されるだけで矛盾しない）。
   */
  aura?: { towerDamageBonus?: number; towerRangeBonus?: number };
}

/** 罠性能（経路マスに設置、踏んだ地上敵に発動） */
export interface TrapSpec {
  damage: number;
  /** 発動可能回数 */
  uses: number;
}

/** 魔力炉性能（マナ源。スロットを消費する） */
export interface ReactorSpec {
  /** マナを生む間隔（tick） */
  intervalTicks: number;
  /** 1回あたりの生成量 */
  manaPerTick: number;
}

/** 燠火性能（設置後にクリックで再発動する範囲ダメージ） */
export interface EmberSpec {
  /** 効果半径（セル距離） */
  radius: number;
  damage: number;
  /** 再発動までの待機 tick */
  cooldownTicks: number;
}

/** 即時呪文（盤面に残らない） */
export interface SpellSpec {
  /** 敵速度の倍率 */
  speedMultiplier: number;
  /** 効果時間（tick） */
  durationTicks: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  tower?: TowerSpec;
  trap?: TrapSpec;
  reactor?: ReactorSpec;
  ember?: EmberSpec;
  spell?: SpellSpec;
}

/** カードを出すときに指定する対象の種別 */
export type PlacementKind = 'slot' | 'path' | 'none';

/**
 * カードの配置先種別を返す
 *
 * UI はこれを見て「置けるマスだけをハイライトする」（設計書 §9.7）。
 * 選択空間 60通りを数個に落とすための情報。
 */
export const placementKindOf = (card: CardDefinition): PlacementKind => {
  if (card.type === 'trap') return 'path';
  if (card.type === 'spell') return 'none';
  return 'slot';
};
