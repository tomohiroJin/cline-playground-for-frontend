/**
 * 灰燼の城壁 - カード型定義
 *
 * カードはデータ駆動: 効果は少数のスペック（tower/trap/spell/tactic）の
 * 組み合わせで表現し、カード追加＝データ追加にする。
 */

export type CardType = 'tower' | 'trap' | 'spell' | 'tactic';
export type Rarity = 'common' | 'rare' | 'epic';

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
  /** オーラ効果（定義されていれば攻撃せず、隣接タワーを強化する） */
  aura?: { towerDamageBonus: number };
}

/** 罠性能（経路マスに設置、踏んだ敵に発動） */
export interface TrapSpec {
  damage: number;
  /** 発動可能回数 */
  uses: number;
}

/** スペル効果（準備フェーズで使用、即時 or 次ウェーブに作用） */
export interface SpellSpec {
  /** 次ウェーブの敵のスポーン時ダメージ */
  openingDamage?: number;
  /** 次ウェーブの敵速度倍率（0.6 = 40%減速） */
  speedMultiplier?: number;
  /** 即時マナ獲得 */
  gainMana?: number;
}

/** 戦術効果（永続的なルール変更） */
export interface TacticSpec {
  /** 全タワー攻撃倍率への加算（0.15 = +15%） */
  towerAttackBonus?: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  rarity: Rarity;
  description: string;
  tower?: TowerSpec;
  trap?: TrapSpec;
  spell?: SpellSpec;
  tactic?: TacticSpec;
}
