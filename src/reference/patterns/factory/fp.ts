/**
 * ピザを表すデータ型です。
 * - name: ピザの名前 (例: "チーズピザ", "ペパロニピザ" など)
 * - price: ピザの価格
 */
export type Pizza = {
  name: string;
  price: number;
};

/**
 * ピザの種類を表す文字列リテラル型です。
 */
export const PIZZA_TYPES = ["cheese", "pepperoni", "margherita"] as const;
export type PizzaType = (typeof PIZZA_TYPES)[number];

/**
 * ピザの種類ごとの情報を表すオブジェクトです。
 */
export const PIZZA_KINDS: Record<PizzaType, Pizza> = {
  cheese: { name: "チーズピザ", price: 1200 },
  pepperoni: { name: "ペパロニピザ", price: 1500 },
  margherita: { name: "マルゲリータピザ", price: 1300 },
} as const;
export type PizzaKind = (typeof PIZZA_KINDS)[PizzaType];

/**
 * ピザを生成するメインのファクトリ関数です。
 * 文字列で指定されたタイプに応じて対応するピザを生成して返します。
 *
 * @param pizzaType - ピザの種類 (例: "cheese", "pepperoni", "margherita")
 * @returns 生成されたピザオブジェクト (name, price)
 * @throws エラー - 未知のピザタイプが指定された場合
 */
export function createPizza(pizzaType: string): Pizza {
  if (!PIZZA_TYPES.includes(pizzaType.toLowerCase() as PizzaType)) {
    throw new Error(`未知のピザタイプです: ${pizzaType}`);
  }

  return PIZZA_KINDS[pizzaType.toLowerCase() as PizzaType];
}
