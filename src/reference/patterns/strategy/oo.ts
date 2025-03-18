/**
 * 割引計算の戦略を表すインターフェースです。
 * どのような計算方法を用いるかは実装クラスごとに異なります。
 */
export interface DiscountStrategy {
  /**
   * 割引後の価格を取得します。
   * @param originalPrice - 元の価格
   * @returns 割引後の価格
   */
  getDiscountedPrice(originalPrice: number): number;
}

/**
 * 割引を適用しない戦略を表すクラスです。
 */
export class NoDiscountStrategy implements DiscountStrategy {
  /**
   * 割引後の価格を取得します。
   * 割引を行わないため、元の価格をそのまま返します。
   * @param originalPrice - 元の価格
   * @returns 割引後の価格(割引なしの場合は元の価格)
   */
  public getDiscountedPrice(originalPrice: number): number {
    return originalPrice;
  }
}

/**
 * 季節割引を行う戦略を表すクラスです。
 * 例として、常に20%オフで計算します。
 */
export class SeasonalDiscountStrategy implements DiscountStrategy {
  /**
   * 割引後の価格を取得します。
   * 20%オフを適用します。
   * @param originalPrice - 元の価格
   * @returns 20%オフ後の価格
   */
  public getDiscountedPrice(originalPrice: number): number {
    return originalPrice * 0.8;
  }
}

/**
 * まとめ買い割引を行う戦略を表すクラスです。
 * 例として、常に500円引きで計算します。
 * (結果が0円未満にはならないようにします。)
 */
export class BulkDiscountStrategy implements DiscountStrategy {
  /**
   * 割引後の価格を取得します。
   * 500円割引を適用します。最低でも0円に調整します。
   * @param originalPrice - 元の価格
   * @returns 500円割引後の価格(0円未満にはならない)
   */
  public getDiscountedPrice(originalPrice: number): number {
    const discountedPrice = originalPrice - 500;
    return Math.max(0, discountedPrice);
  }
}

/**
 * 商品を表すクラスです。
 * 割引戦略(DiscountStrategy)を設定して価格を算出します。
 */
export class Product {
  private name: string;
  private price: number;
  private discountStrategy: DiscountStrategy;

  /**
   * コンストラクタ
   * @param name - 商品名
   * @param price - 商品の通常価格
   * @param discountStrategy - 割引戦略(どのような割引方法を使うか)
   */
  constructor(name: string, price: number, discountStrategy: DiscountStrategy) {
    this.name = name;
    this.price = price;
    this.discountStrategy = discountStrategy;
  }

  /**
   * 割引戦略を動的に変更します。
   * @param discountStrategy - 新たに適用する割引戦略
   */
  public setDiscountStrategy(discountStrategy: DiscountStrategy): void {
    this.discountStrategy = discountStrategy;
  }

  /**
   * 商品名を取得します。
   * @returns 商品名
   */
  public getName(): string {
    return this.name;
  }

  /**
   * 通常価格を取得します。
   * @returns 商品の通常価格
   */
  public getPrice(): number {
    return this.price;
  }

  /**
   * 割引後の価格を取得します。
   * 現在設定されている割引戦略を使用して計算します。
   * @returns 割引後の価格
   */
  public getDiscountedPrice(): number {
    return this.discountStrategy.getDiscountedPrice(this.price);
  }
}
