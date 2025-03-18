import { Coffee, Tea } from "./oo";

/**
 * テンプレートメソッドパターン(OOP)のテスト
 */
describe("CaffeineBeverageのテンプレートメソッドテスト", () => {
  beforeEach(() => {
    // すべてのテストで console.log のモックを初期化
    jest.spyOn(global.console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // テスト後にモックをクリア
    (console.log as jest.Mock).mockClear();
  });

  it("CoffeeクラスのprepareRecipe()が正しい順序で呼ばれること", () => {
    const coffee = new Coffee();
    coffee.prepareRecipe();

    // 呼び出し順を確認
    expect(console.log).toHaveBeenNthCalledWith(1, "お湯を沸かします");
    expect(console.log).toHaveBeenNthCalledWith(2, "コーヒーをドリップします");
    expect(console.log).toHaveBeenNthCalledWith(3, "カップに注ぎます");
    expect(console.log).toHaveBeenNthCalledWith(4, "砂糖とミルクを追加します");
  });

  it("TeaクラスのprepareRecipe()が正しい順序で呼ばれること", () => {
    const tea = new Tea();
    tea.prepareRecipe();

    // 呼び出し順を確認
    expect(console.log).toHaveBeenNthCalledWith(1, "お湯を沸かします");
    expect(console.log).toHaveBeenNthCalledWith(2, "ティーバッグを浸します");
    expect(console.log).toHaveBeenNthCalledWith(3, "カップに注ぎます");
    expect(console.log).toHaveBeenNthCalledWith(4, "レモンを追加します");
  });
});
