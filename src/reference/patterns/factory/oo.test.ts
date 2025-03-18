import {
  PizzaFactory,
  CheesePizza,
  PepperoniPizza,
  MargheritaPizza,
} from "./oo";

/**
 * ファクトリーパターン(OOP)でピザを生成するテストです。
 */
describe("PizzaFactoryのテスト", () => {
  it("チーズピザを生成できること", () => {
    const pizza = PizzaFactory.createPizza("cheese");
    expect(pizza).toBeInstanceOf(CheesePizza);
    expect(pizza.getName()).toBe("チーズピザ");
    expect(pizza.getPrice()).toBe(1200);
  });

  it("ペパロニピザを生成できること", () => {
    const pizza = PizzaFactory.createPizza("pepperoni");
    expect(pizza).toBeInstanceOf(PepperoniPizza);
    expect(pizza.getName()).toBe("ペパロニピザ");
    expect(pizza.getPrice()).toBe(1500);
  });

  it("マルゲリータピザを生成できること", () => {
    const pizza = PizzaFactory.createPizza("margherita");
    expect(pizza).toBeInstanceOf(MargheritaPizza);
    expect(pizza.getName()).toBe("マルゲリータピザ");
    expect(pizza.getPrice()).toBe(1300);
  });

  it("未知のピザタイプを指定した場合はエラーを投げること", () => {
    expect(() => {
      PizzaFactory.createPizza("unknown");
    }).toThrowError("未知のピザタイプです: unknown");
  });
});
