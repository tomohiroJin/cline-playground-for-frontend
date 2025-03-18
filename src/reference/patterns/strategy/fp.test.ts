import {
  createProduct,
  noDiscount,
  getDiscountedPrice,
  seasonalDiscount,
  bulkDiscount,
  updateDiscountFunction,
} from "./fp";

/**
 * 商品データと割引関数の組み合わせに関するテストです。
 * 状態を持たずに常に新しいオブジェクトを返す形で、関数型のストラテジーパターンを検証します。
 */
describe("関数型で実装した商品データのテスト", () => {
  it("割引なしの場合は元の価格がそのまま返ること", () => {
    const product = createProduct("ノートパソコン", 100000, noDiscount);
    expect(getDiscountedPrice(product)).toBe(100000);
  });

  it("季節割引（20%オフ）を適用した場合は20%引きの価格が返ること", () => {
    const product = createProduct("ノートパソコン", 100000, seasonalDiscount);
    // 100000 の 20%オフ → 80000
    expect(getDiscountedPrice(product)).toBe(80000);
  });

  it("まとめ買い割引（500円引き）を適用した場合は500円引きの価格が返ること", () => {
    const product = createProduct("ノートパソコン", 100000, bulkDiscount);
    // 100000 - 500 → 99500
    expect(getDiscountedPrice(product)).toBe(99500);
  });

  it("状態を変更せず、新しい商品オブジェクトを返す形で割引関数を切り替えられること", () => {
    const baseProduct = createProduct("ノートパソコン", 100000);
    expect(getDiscountedPrice(baseProduct)).toBe(100000);

    // 季節割引に切り替える → 新しいオブジェクト
    const seasonalProduct = updateDiscountFunction(
      baseProduct,
      seasonalDiscount
    );
    expect(getDiscountedPrice(seasonalProduct)).toBe(80000);

    // 元の baseProduct は割引なしのまま
    expect(getDiscountedPrice(baseProduct)).toBe(100000);

    // まとめ買い割引に切り替える → さらに別の新オブジェクト
    const bulkProduct = updateDiscountFunction(seasonalProduct, bulkDiscount);
    expect(getDiscountedPrice(bulkProduct)).toBe(99500);

    // seasonalProduct はまだ季節割引のまま
    expect(getDiscountedPrice(seasonalProduct)).toBe(80000);
  });

  it("商品価格が500円未満の場合、まとめ買い割引を適用しても0円以下にはならないこと", () => {
    const cheapProduct = createProduct("安い商品", 300, bulkDiscount);
    expect(getDiscountedPrice(cheapProduct)).toBe(0);
  });
});
