/**
 * 抽象クラス CaffeineBeverage
 * - 飲み物を作る手順(テンプレートメソッド)を定義する
 * - 一部のステップ（brew, addCondiments）をサブクラスに実装させる
 */
export abstract class CaffeineBeverage {
  /**
   * テンプレートメソッド
   * 飲み物を作る手順を定義し、具体的なステップを抽象メソッドとして呼び出す
   */
  public prepareRecipe(): void {
    this.boilWater();
    this.brew(); // サブクラスで実装
    this.pourInCup();
    this.addCondiments(); // サブクラスで実装
  }

  /**
   * お湯を沸かすステップ
   * - すべての飲み物で共通な処理
   */
  protected boilWater(): void {
    console.log("お湯を沸かします");
  }

  /**
   * カップに注ぐステップ
   * - すべての飲み物で共通な処理
   */
  protected pourInCup(): void {
    console.log("カップに注ぎます");
  }

  /**
   * サブクラスで実装される抽象メソッド
   * - コーヒーをドリップする、紅茶を浸出する、など
   */
  protected abstract brew(): void;

  /**
   * サブクラスで実装される抽象メソッド
   * - ミルクや砂糖、レモンを入れる、など
   */
  protected abstract addCondiments(): void;
}

/**
 * Coffee クラス
 * - brew() でコーヒーをドリップ
 * - addCondiments() で砂糖やミルクを追加
 */
export class Coffee extends CaffeineBeverage {
  protected brew(): void {
    console.log("コーヒーをドリップします");
  }

  protected addCondiments(): void {
    console.log("砂糖とミルクを追加します");
  }
}

/**
 * Tea クラス
 * - brew() でティーバッグを浸出
 * - addCondiments() でレモンを追加
 */
export class Tea extends CaffeineBeverage {
  protected brew(): void {
    console.log("ティーバッグを浸します");
  }

  protected addCondiments(): void {
    console.log("レモンを追加します");
  }
}
