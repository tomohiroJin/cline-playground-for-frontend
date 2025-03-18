/**
 * 割引を行う関数型です。
 *
 * @param originalPrice - 元の価格
 * @returns 割引後の価格
 */
export type DiscountFunction = (originalPrice: number) => number;

/**
 * 割引を行わない関数です。
 *
 * @param originalPrice - 元の価格
 * @returns 元の価格（割引なし）
 */
export const noDiscount: DiscountFunction = (originalPrice) => {
  return originalPrice;
};

/**
 * 季節割引を行う関数です。ここでは一律20%割引とします。
 *
 * @param originalPrice - 元の価格
 * @returns 20%割引後の価格
 */
export const seasonalDiscount: DiscountFunction = (originalPrice) => {
  return originalPrice * 0.8;
};

/**
 * まとめ買い割引を行う関数です。ここでは一律500円引きとします。
 * ただし0円未満にはなりません。
 *
 * @param originalPrice - 元の価格
 * @returns 500円割引後の価格（下限0円）
 */
export const bulkDiscount: DiscountFunction = (originalPrice) => {
  const discounted = originalPrice - 500;
  return Math.max(0, discounted);
};

/**
 * 商品を表すデータ型です。
 * - name: 商品名
 * - price: 商品の通常価格
 * - discountFunction: 適用する割引関数
 */
export interface Product {
  name: string;
  price: number;
  discountFunction: DiscountFunction;
}

/**
 * 新しい商品データを生成します。
 *
 * @param name - 商品名
 * @param price - 通常価格
 * @param discountFunction - 初期割引関数 (省略時は noDiscount)
 * @returns 新しい商品データ
 */
export function createProduct(
  name: string,
  price: number,
  discountFunction: DiscountFunction = noDiscount
): Product {
  return {
    name,
    price,
    discountFunction,
  };
}

/**
 * 商品の割引後の価格を取得します。
 *
 * @param product - 商品データ
 * @returns 割引後の価格
 */
export function getDiscountedPrice(product: Product): number {
  return product.discountFunction(product.price);
}

/**
 * 商品の割引関数を切り替えた新しい商品を返します。
 * (元の商品データを変更せず、新しいオブジェクトを返す)
 *
 * @param product - 商品データ
 * @param newDiscount - 新しい割引関数
 * @returns 割引関数を変更した新しい商品データ
 */
export function updateDiscountFunction(
  product: Product,
  newDiscount: DiscountFunction
): Product {
  return {
    ...product,
    discountFunction: newDiscount,
  };
}
