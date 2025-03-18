/**
 * control-structures.test.ts
 * TypeScriptの制御構文とループ文に関する基本的な例を含むテスト。
 * このテストでは、if文、switch文、forループ、whileループ、for...of、for...inなどの構文を説明とテストを行います。
 */

// if 文の例
describe("条件分岐 (if 文)", () => {
  test("if 文での条件分岐", () => {
    const value = 10;
    let result: string;

    if (value > 5) {
      result = "大きい";
    } else {
      result = "小さいか等しい";
    }

    expect(result).toBe("大きい");
  });
});

// switch 文の例
describe("条件分岐 (switch 文)", () => {
  test("switch 文の使用例", () => {
    const fruit: string = "apple";
    let result: string;

    switch (fruit) {
      case "apple":
        result = "リンゴ";
        break;
      case "banana":
        result = "バナナ";
        break;
      default:
        result = "不明";
    }

    expect(result).toBe("リンゴ");
  });
});

// for ループの例
describe("ループ (for 文)", () => {
  test("for 文での繰り返し", () => {
    const numbers = [1, 2, 3];
    let sum = 0;

    for (let i = 0; i < numbers.length; i++) {
      sum += numbers[i];
    }

    expect(sum).toBe(6);
  });
});

// while ループの例
describe("ループ (while 文)", () => {
  test("while 文の使用例", () => {
    let counter = 0;
    let result = 0;

    while (counter < 5) {
      result += counter;
      counter++;
    }

    expect(result).toBe(10); // 0 + 1 + 2 + 3 + 4
  });
});

// for...of 文の例
describe("ループ (for...of 文)", () => {
  test("for...of 文での繰り返し", () => {
    const numbers = [10, 20, 30];
    let total = 0;

    for (const num of numbers) {
      total += num;
    }

    expect(total).toBe(60);
  });
});

// for...in 文の例
describe("ループ (for...in 文)", () => {
  test("for...in 文での繰り返し", () => {
    const object = { a: 1, b: 2, c: 3 };
    let keys = "";

    for (const key in object) {
      keys += key;
    }

    expect(keys).toBe("abc");
  });
});
