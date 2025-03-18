/**
 * ピザを表すインターフェースです。
 * 各具体的なピザ(チーズピザ, ペパロニピザなど)はこれを実装します。
 */
export interface Pizza {
  /**
   * ピザの名前を取得します。
   * 例: "チーズピザ", "ペパロニピザ" など
   */
  getName(): string;

  /**
   * ピザの価格を取得します。
   */
  getPrice(): number;
}

/**
 * チーズピザを表すクラスです。
 */
export class CheesePizza implements Pizza {
  public getName(): string {
    return "チーズピザ";
  }

  public getPrice(): number {
    return 1200;
  }
}

/**
 * ペパロニピザを表すクラスです。
 */
export class PepperoniPizza implements Pizza {
  public getName(): string {
    return "ペパロニピザ";
  }

  public getPrice(): number {
    return 1500;
  }
}

/**
 * マルゲリータピザを表すクラスです。
 */
export class MargheritaPizza implements Pizza {
  public getName(): string {
    return "マルゲリータピザ";
  }

  public getPrice(): number {
    return 1300;
  }
}

/**
 * ピザを生成する工場クラスです。
 * 要求された種類のピザオブジェクトを返します。
 */
export class PizzaFactory {
  /**
   * 引数に応じて対応するピザオブジェクトを生成して返します。
   *
   * @param pizzaType - ピザの種類 (例: "cheese", "pepperoni", "margherita")
   * @returns 生成されたピザオブジェクト
   */
  public static createPizza(pizzaType: string): Pizza {
    switch (pizzaType.toLowerCase()) {
      case "cheese":
        return new CheesePizza();
      case "pepperoni":
        return new PepperoniPizza();
      case "margherita":
        return new MargheritaPizza();
      default:
        throw new Error(`未知のピザタイプです: ${pizzaType}`);
    }
  }
}
