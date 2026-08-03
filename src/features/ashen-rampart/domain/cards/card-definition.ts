/**
 * 灰燼の城壁 - カード型定義
 *
 * カードはデータ駆動。効果は少数のスペックの組み合わせで表現し、
 * カード追加＝データ追加にする。
 *
 * 設計原則（設計書 §7）: 最高効率のカードには必ず「効かない相手」を作る。
 * 塔は hitsFlying で適用範囲を制限し、効率差はそのまま残す。
 */

export type CardType = 'tower' | 'trap' | 'spell' | 'reactor' | 'ember' | 'levy';

/** タワー性能 */
export interface TowerSpec {
  /** 守り手のHP。敵に殴られて 0 になると消滅する */
  hp: number;
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
  /**
   * 重装特効のしきい値（最大HP）。これ以上の敵に heavyBonusMultiplier を掛ける
   *
   * 徹甲弩は低HP敵に非効率・高HP敵に強いという形で、
   * 「効率の順位が敵によって入れ替わる」状態を作るための仕組み。
   */
  heavyBonusThreshold?: number;
  /** 重装特効の倍率 */
  heavyBonusMultiplier?: number;
}

/** 罠性能（経路マスに設置、踏んだ敵に発動） */
export interface TrapSpec {
  damage: number;
  /** 発動可能回数 */
  uses: number;
  /** 飛行敵を地上化する tick 数（落網）。持たない罠は undefined */
  groundedTicks?: number;
  /** 地上敵を足止めする tick 数（石壁）。持たない罠は undefined */
  stunTicks?: number;
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

/** 徴発（山札の上を見て1枚選ぶ） */
export interface LevySpec {
  /** 提示する枚数 */
  peekCount: number;
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
  levy?: LevySpec;
  /**
   * デッキに入れられる同名の上限。省略時は MAX_COPIES（3枚）
   *
   * マナ源だけを別扱いにするための逃がし口。MAX_COPIES の目的は
   * 弓兵スパムの防止であって、マナ源を絞ることではなかった。
   */
  maxCopies?: number;
}

/** カードを出すときに指定する対象の種別 */
export type PlacementKind = 'unit' | 'reactor' | 'path' | 'none';

/**
 * カードの配置先種別を返す
 *
 * 設置マスの概念が消えたため、守り手は砦以外のどこにでも置ける。
 * 魔力炉だけは経路外に限る——コスト0・デッキ上限なしのため、
 * 経路に置けると無限の無料ブロッカーになる（設計書 §7.5）。
 */
export const placementKindOf = (card: CardDefinition): PlacementKind => {
  if (card.type === 'trap' || card.type === 'ember') return 'path';
  if (card.type === 'spell' || card.type === 'levy') return 'none';
  if (card.type === 'reactor') return 'reactor';
  return 'unit';
};
