import { createPizza } from "./fp";

/**
 * ファクトリーパターン(関数型)のテストコードです。
 */
describe("createPizza(関数型)のテスト", () => {
  it("チーズピザを生成できること", () => {
    const pizza = createPizza("cheese");
    expect(pizza.name).toBe("チーズピザ");
    expect(pizza.price).toBe(1200);
  });

  it("ペパロニピザを生成できること", () => {
    const pizza = createPizza("pepperoni");
    expect(pizza.name).toBe("ペパロニピザ");
    expect(pizza.price).toBe(1500);
  });

  it("マルゲリータピザを生成できること", () => {
    const pizza = createPizza("margherita");
    expect(pizza.name).toBe("マルゲリータピザ");
    expect(pizza.price).toBe(1300);
  });

  it("未知のピザタイプを指定した場合はエラーを投げること", () => {
    expect(() => {
      createPizza("unknown");
    }).toThrowError("未知のピザタイプです: unknown");
  });
});
