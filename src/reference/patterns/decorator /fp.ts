/**
 * 飲み物を表すデータ構造です。
 * - description: 飲み物の説明
 * - cost: 飲み物の価格
 */
export type Beverage = {
  description: string;
  cost: number;
};

/**
 * コーヒーを生成する関数です。
 * @returns {Beverage} - "コーヒー" という説明と 150円の価格を持つBeverage
 */
export function createCoffee(): Beverage {
  return {
    description: "コーヒー",
    cost: 150,
  };
}

/**
 * エスプレッソを生成する関数です。
 * @returns {Beverage} - "エスプレッソ" という説明と 200円の価格を持つBeverage
 */
export function createEspresso(): Beverage {
  return {
    description: "エスプレッソ",
    cost: 200,
  };
}

/**
 * ミルクを追加するデコレータ関数です。
 * @param beverage - 元の飲み物
 * @returns 新しく "ミルク" を追加した説明と、30円加算された価格を持つBeverage
 */
export function addMilk(beverage: Beverage): Beverage {
  return {
    description: `${beverage.description}, ミルク`,
    cost: beverage.cost + 30,
  };
}

/**
 * 砂糖を追加するデコレータ関数です。
 * @param beverage - 元の飲み物
 * @returns 新しく "砂糖" を追加した説明と、20円加算された価格を持つBeverage
 */
export function addSugar(beverage: Beverage): Beverage {
  return {
    description: `${beverage.description}, 砂糖`,
    cost: beverage.cost + 20,
  };
}
