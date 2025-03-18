/**
 * functions.test.ts
 * TypeScriptの関数に関する基本的な例を含むテスト。
 * このテストでは、関数宣言、アロー関数、`this` のスコープの違いについて説明とテストを行います。
 */

// 関数宣言
describe("関数宣言 (Function Declaration)", () => {
  test("基本的な関数の例", () => {
    function add(a: number, b: number): number {
      return a + b;
    }

    expect(add(2, 3)).toBe(5);
  });

  test("デフォルト引数の例", () => {
    function greet(name: string = "ゲスト"): string {
      return `こんにちは、${name}さん！`;
    }

    expect(greet()).toBe("こんにちは、ゲストさん！");
    expect(greet("太郎")).toBe("こんにちは、太郎さん！");
  });

  test("可変長引数 (Rest Parameters)", () => {
    function sum(...numbers: number[]): number {
      return numbers.reduce((total, num) => total + num, 0);
    }

    expect(sum(1, 2, 3, 4)).toBe(10);
    expect(sum()).toBe(0);
  });
});

// アロー関数
describe("アロー関数 (Arrow Functions)", () => {
  test("基本的なアロー関数の例", () => {
    const multiply = (a: number, b: number): number => a * b;

    expect(multiply(2, 3)).toBe(6);
  });

  test("関数内での短い処理に便利", () => {
    const square = (x: number): number => x * x;

    expect(square(4)).toBe(16);
  });

  test("複数行の処理にも対応", () => {
    const calculateArea = (width: number, height: number): number => {
      const area = width * height;
      return area;
    };

    expect(calculateArea(5, 3)).toBe(15);
  });
});

// this のスコープの違い
describe("this のスコープ (Function vs Arrow Function)", () => {
  test("関数宣言での this の例", () => {
    const obj = {
      value: 42,
      getValue: function () {
        return this.value; // this は obj を参照
      },
    };

    expect(obj.getValue()).toBe(42);

    const getValueFunction = obj.getValue;
    // this は失われ、undefined を参照するためエラーになる
    // expect(getValueFunction()).toBeUndefined(); // TypeError
  });

  test("アロー関数での this の例", () => {
    const obj = {
      value: 42,
      getValue: () => {
        // アロー関数では this は親スコープを継承
        // この場合、グローバルスコープまたは undefined を参照する
        // return this; // TypeError
      },
    };

    expect(obj.getValue()).toBeUndefined(); // グローバルでは undefined が期待される
  });

  test("アロー関数が this を固定する例", () => {
    const obj = {
      value: 42,
      getValue: function () {
        const arrow = () => this.value; // 親スコープ (obj) の this を参照
        return arrow();
      },
    };

    expect(obj.getValue()).toBe(42);
  });
});
