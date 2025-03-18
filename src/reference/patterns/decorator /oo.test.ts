import { Coffee, Espresso, MilkDecorator, SugarDecorator } from "./oo";

/**
 * デコレーターパターン(OOP)のテストです。
 */
describe("デコレーターパターン(OOP)のテスト", () => {
  it("コーヒーに何も追加しない場合は 'コーヒー' (価格150) になる", () => {
    const coffee = new Coffee();
    expect(coffee.getDescription()).toBe("コーヒー");
    expect(coffee.cost()).toBe(150);
  });

  it("エスプレッソに何も追加しない場合は 'エスプレッソ' (価格200) になる", () => {
    const espresso = new Espresso();
    expect(espresso.getDescription()).toBe("エスプレッソ");
    expect(espresso.cost()).toBe(200);
  });

  it("コーヒーにミルクを追加した場合は、'コーヒー, ミルク' (価格180) になる", () => {
    const coffee = new Coffee();
    const coffeeWithMilk = new MilkDecorator(coffee);
    expect(coffeeWithMilk.getDescription()).toBe("コーヒー, ミルク");
    expect(coffeeWithMilk.cost()).toBe(180); // 150 + 30
  });

  it("エスプレッソに砂糖を追加した場合は、'エスプレッソ, 砂糖' (価格220) になる", () => {
    const espresso = new Espresso();
    const espressoWithSugar = new SugarDecorator(espresso);
    expect(espressoWithSugar.getDescription()).toBe("エスプレッソ, 砂糖");
    expect(espressoWithSugar.cost()).toBe(220); // 200 + 20
  });

  it("コーヒーにミルクと砂糖を両方追加した場合は、'コーヒー, ミルク, 砂糖' (価格200) になる", () => {
    const coffee = new Coffee();
    const coffeeWithMilk = new MilkDecorator(coffee);
    const coffeeWithMilkAndSugar = new SugarDecorator(coffeeWithMilk);

    expect(coffeeWithMilkAndSugar.getDescription()).toBe(
      "コーヒー, ミルク, 砂糖"
    );
    expect(coffeeWithMilkAndSugar.cost()).toBe(200); // 150 + 30 + 20
  });
});
