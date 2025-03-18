import { addMilk, addSugar, createCoffee, createEspresso } from "./fp";

/**
 * デコレーターパターン(関数型)のテストです。
 */
describe("デコレーターパターン(関数型)のテスト", () => {
  it("コーヒーに何も追加しない場合は 'コーヒー' (価格150) となる", () => {
    const coffee = createCoffee();
    expect(coffee.description).toBe("コーヒー");
    expect(coffee.cost).toBe(150);
  });

  it("エスプレッソに何も追加しない場合は 'エスプレッソ' (価格200) となる", () => {
    const espresso = createEspresso();
    expect(espresso.description).toBe("エスプレッソ");
    expect(espresso.cost).toBe(200);
  });

  it("コーヒーにミルクを追加した場合は 'コーヒー, ミルク' (価格180) となる", () => {
    const coffee = createCoffee();
    const coffeeWithMilk = addMilk(coffee);

    expect(coffeeWithMilk.description).toBe("コーヒー, ミルク");
    expect(coffeeWithMilk.cost).toBe(180); // 150 + 30
  });

  it("エスプレッソに砂糖を追加した場合は 'エスプレッソ, 砂糖' (価格220) となる", () => {
    const espresso = createEspresso();
    const espressoWithSugar = addSugar(espresso);

    expect(espressoWithSugar.description).toBe("エスプレッソ, 砂糖");
    expect(espressoWithSugar.cost).toBe(220); // 200 + 20
  });

  it("コーヒーにミルクと砂糖を両方追加した場合は 'コーヒー, ミルク, 砂糖' (価格200) となる", () => {
    const coffee = createCoffee();
    const coffeeWithMilk = addMilk(coffee);
    const coffeeWithMilkAndSugar = addSugar(coffeeWithMilk);

    expect(coffeeWithMilkAndSugar.description).toBe("コーヒー, ミルク, 砂糖");
    expect(coffeeWithMilkAndSugar.cost).toBe(200); // 150 + 30 + 20
  });

  it("デコレータを順番に合成しても結果が一貫していること", () => {
    const coffee = createCoffee();
    // デコレータを「addSugar → addMilk」の順で適用
    const sugarThenMilk = addMilk(addSugar(coffee));

    expect(sugarThenMilk.description).toBe("コーヒー, 砂糖, ミルク");
    expect(sugarThenMilk.cost).toBe(200); // 150 + 20 + 30

    // デコレータを「addMilk → addSugar」の順で適用
    const milkThenSugar = addSugar(addMilk(coffee));

    expect(milkThenSugar.description).toBe("コーヒー, ミルク, 砂糖");
    expect(milkThenSugar.cost).toBe(200); // 150 + 30 + 20

    // 順番によって description は異なるが、計算結果(コスト)は同じ
  });
});
