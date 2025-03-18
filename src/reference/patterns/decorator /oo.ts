/**
 * 飲み物(Beverage)を表すインターフェースです。
 * - getDescription(): string
 * - cost(): number
 */
export interface Beverage {
  /**
   * 飲み物の説明文を返します。
   * 例: "コーヒー", "エスプレッソ" など
   */
  getDescription(): string;

  /**
   * 飲み物の価格を返します。
   */
  cost(): number;
}

/**
 * 通常のコーヒーを表すクラスです。
 * 単純に「コーヒー」の説明と価格を返します。
 */
export class Coffee implements Beverage {
  public getDescription(): string {
    return "コーヒー";
  }

  public cost(): number {
    return 150;
  }
}

/**
 * エスプレッソを表すクラスです。
 * "エスプレッソ" の説明と価格を返します。
 */
export class Espresso implements Beverage {
  public getDescription(): string {
    return "エスプレッソ";
  }

  public cost(): number {
    return 200;
  }
}

/**
 * 飲み物のデコレータを表す抽象クラスです。
 * Beverageインターフェースを実装しつつ、
 * "Beverage を持つBeverage" として定義します。
 */
export abstract class BeverageDecorator implements Beverage {
  protected beverage: Beverage;

  constructor(beverage: Beverage) {
    this.beverage = beverage;
  }

  /**
   * 具体的な説明や価格はサブクラス側で実装します。
   */
  public abstract getDescription(): string;
  public abstract cost(): number;
}

/**
 * ミルクを追加するデコレータです。
 * ベースとなるBeverageの説明・価格に加え、
 * "ミルク" と追加料金を足し合わせます。
 */
export class MilkDecorator extends BeverageDecorator {
  /**
   * 飲み物の説明に "ミルク" を追加します。
   */
  public getDescription(): string {
    return this.beverage.getDescription() + ", ミルク";
  }

  /**
   * 飲み物の価格に 30円を追加します。
   */
  public cost(): number {
    return this.beverage.cost() + 30;
  }
}

/**
 * 砂糖を追加するデコレータです。
 * ベースとなるBeverageの説明・価格に加え、
 * "砂糖" と追加料金を足し合わせます。
 */
export class SugarDecorator extends BeverageDecorator {
  /**
   * 飲み物の説明に "砂糖" を追加します。
   */
  public getDescription(): string {
    return this.beverage.getDescription() + ", 砂糖";
  }

  /**
   * 飲み物の価格に 20円を追加します。
   */
  public cost(): number {
    return this.beverage.cost() + 20;
  }
}
