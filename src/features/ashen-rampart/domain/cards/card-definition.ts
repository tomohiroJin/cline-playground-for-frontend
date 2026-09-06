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

/**
 * カードの入手経路（反復6・設計書 §4.6 / §5.5）
 *
 * - `buildable`   : 構築画面で選べ、獲得の3択にも出る（既定）
 * - `acquire-only`: 構築では選べず、遠征中の獲得でのみ手に入る。
 *                   **獲得が「見たことのない札」で自己紹介するための仕掛け**
 * - `retired`     : 構築にも獲得にも出ないが、定義は残す。徴発がこれ
 */
export type CardAvailability = 'buildable' | 'acquire-only' | 'retired';

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
   * 貫通。守り手から標的へ引いた直線上にいる敵すべてに当たる
   *
   * 単体・範囲のどちらとも重ならない3つ目の軸。反復2 のエフェクト設計は
   * 「範囲=太実線 / 単体=細実線 / 貫通=破線」と線種を定義済みだが、
   * 貫通する守り手が存在しなかったため破線は一度も描かれていない。
   */
  piercing?: boolean;
}

/** 罠性能（経路マスに設置、踏んだ敵に発動） */
export interface TrapSpec {
  damage: number;
  /** 発動可能回数 */
  uses: number;
  /** 飛行敵を地上化する tick 数（落網）。持たない罠は undefined */
  groundedTicks?: number;
}

/** 魔力炉性能（マナ源。経路上には置けない。§7.5） */
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
   * **反復6 で魔力炉の例外を外し、現在どのカードもこのフィールドを
   * 持たない（未使用フィールド）。** 以前はマナ源（魔力炉）だけを
   * 別扱いにするための逃がし口として使っていたが、12枚デッキでは
   * 魔力炉も同名3枚上限を守る必要があると判断し、例外を廃止した
   * （`card-pool.ts` の `reactor` 定義・設計書 §4.6 参照）。
   * 型としては将来また個別の上限が要る場合に備えて残してある。
   */
  maxCopies?: number;
  /**
   * カードの入手経路。省略時は 'buildable'
   *
   * 設計書 §4.6・§5.5 の獲得専用カード（構築では選べず獲得でのみ出る）と、
   * 定義は残すが構築にも獲得にも出さない札（徴発）を表す。
   */
  availability?: CardAvailability;
}

/** カードを出すときに指定する対象の種別 */
export type PlacementKind = 'unit' | 'reactor' | 'path' | 'none';

/**
 * カードの配置先種別を返す
 *
 * 設置マスの概念が消えたため、守り手は砦以外のどこにでも置ける。
 * 魔力炉だけは経路外に限る——コスト0のため、経路に置けると
 * 無限の無料ブロッカーになる（設計書 §7.5）。
 * **反復6 で同名上限の例外は外れたが、この経路外制約はコストが
 * 理由であり無関係。上限の有無に関わらず引き続き必要。**
 */
export const placementKindOf = (card: CardDefinition): PlacementKind => {
  if (card.type === 'trap' || card.type === 'ember') return 'path';
  if (card.type === 'spell' || card.type === 'levy') return 'none';
  if (card.type === 'reactor') return 'reactor';
  return 'unit';
};
