import {
  Product,
  NoDiscountStrategy,
  SeasonalDiscountStrategy,
  BulkDiscountStrategy,
} from "./oo";

/**
 * Product クラスのテストです。
 * 割引戦略(Strategy Pattern)を切り替えて価格が変わることを検証します。
 */
describe("Productクラスにおける割引戦略のテスト", () => {
  it("割引なしの場合は元の価格を返すこと", () => {
    const product = new Product(
      "ノートパソコン",
      100000,
      new NoDiscountStrategy()
    );
    expect(product.getDiscountedPrice()).toBe(100000);
  });

  it("季節割引（20%オフ）を適用した場合は20%引きの価格を返すこと", () => {
    const product = new Product(
      "ノートパソコン",
      100000,
      new SeasonalDiscountStrategy()
    );
    // 100000 の 20%オフ → 80000
    expect(product.getDiscountedPrice()).toBe(80000);
  });

  it("まとめ買い割引（500円引き）を適用した場合は500円値引きされた価格を返すこと", () => {
    const product = new Product(
      "ノートパソコン",
      100000,
      new BulkDiscountStrategy()
    );
    // 100000 - 500 → 99500
    expect(product.getDiscountedPrice()).toBe(99500);
  });

  it("実行時に割引戦略を切り替えた場合は、その場で価格が変わること", () => {
    const product = new Product(
      "ノートパソコン",
      100000,
      new NoDiscountStrategy()
    );
    // 最初は割引なし
    expect(product.getDiscountedPrice()).toBe(100000);

    // 季節割引に切り替え
    product.setDiscountStrategy(new SeasonalDiscountStrategy());
    expect(product.getDiscountedPrice()).toBe(80000);

    // まとめ買い割引に切り替え
    product.setDiscountStrategy(new BulkDiscountStrategy());
    expect(product.getDiscountedPrice()).toBe(99500);
  });
});
