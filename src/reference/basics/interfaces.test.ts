/**
 * interfaces.test.ts
 * TypeScriptのインターフェースに関する基本的な例を含むテスト。
 * このテストでは、基本的なインターフェースの定義、必須プロパティとオプショナルプロパティ、
 * メソッド、拡張、インデックス型、関数型の例を含みます。
 */

// 基本的なインターフェースの定義
describe("基本的なインターフェース (Basic Interface)", () => {
  test("インターフェースの定義と使用", () => {
    interface User {
      name: string;
      age: number;
    }

    const user: User = { name: "太郎", age: 30 };

    expect(user.name).toBe("太郎");
    expect(user.age).toBe(30);
  });

  test("オプショナルプロパティ (Optional Property)", () => {
    interface User {
      name: string;
      age?: number; // オプショナル
    }

    const userWithoutAge: User = { name: "次郎" };
    const userWithAge: User = { name: "三郎", age: 25 };

    expect(userWithoutAge.age).toBeUndefined();
    expect(userWithAge.age).toBe(25);
  });
});

// メソッドを持つインターフェース
describe("メソッドを持つインターフェース (Interface with Methods)", () => {
  test("オブジェクトメソッドの例", () => {
    interface Calculator {
      add(a: number, b: number): number;
      subtract(a: number, b: number): number;
    }

    const calculator: Calculator = {
      add: (a, b) => a + b,
      subtract: (a, b) => a - b,
    };

    expect(calculator.add(2, 3)).toBe(5);
    expect(calculator.subtract(5, 3)).toBe(2);
  });
});

// インターフェースの拡張
describe("インターフェースの拡張 (Interface Inheritance)", () => {
  test("拡張したインターフェースの例", () => {
    interface Animal {
      name: string;
    }

    interface Dog extends Animal {
      breed: string;
    }

    const myDog: Dog = { name: "ポチ", breed: "柴犬" };

    expect(myDog.name).toBe("ポチ");
    expect(myDog.breed).toBe("柴犬");
  });
});

// インデックス型
describe("インデックス型 (Indexable Types)", () => {
  test("文字列インデックス型の例", () => {
    interface StringMap {
      [key: string]: string;
    }

    const myMap: StringMap = {
      key1: "value1",
      key2: "value2",
    };

    expect(myMap["key1"]).toBe("value1");
    expect(myMap["key2"]).toBe("value2");
  });
});

// 関数型のインターフェース
describe("関数型インターフェース (Function Type Interface)", () => {
  test("関数型インターフェースの例", () => {
    interface Greet {
      (name: string): string;
    }

    const greet: Greet = (name) => `こんにちは、${name}さん！`;

    expect(greet("太郎")).toBe("こんにちは、太郎さん！");
  });
});
