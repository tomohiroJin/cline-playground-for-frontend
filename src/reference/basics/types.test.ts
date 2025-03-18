/**
 * types.test.ts
 * TypeScriptの型に関する基本的な例を含むテスト。
 * このテストでは、基本型、ユニオン型、リテラル型、タプル、ジェネリクスについて説明とテストを行います。
 */

// 定数宣言と変数宣言
describe("定数宣言と変数宣言 (Const and Let)", () => {
  test("const の例", () => {
    const name: string = "太郎"; // 再代入不可
    expect(name).toBe("太郎");
  });

  test("let の例", () => {
    let age: number = 25;
    age = 26; // 再代入可能
    expect(age).toBe(26);
  });
});

// 基本型
describe("基本型 (Primitive Types)", () => {
  test("string 型の例", () => {
    const greeting: string = "こんにちは";
    expect(typeof greeting).toBe("string"); // 型が string であることを確認
  });

  test("number 型の例", () => {
    const age: number = 25;
    expect(typeof age).toBe("number"); // 型が number であることを確認
  });

  test("boolean 型の例", () => {
    const isActive: boolean = true;
    expect(typeof isActive).toBe("boolean"); // 型が boolean であることを確認
  });
});

// 配列とタプル
describe("配列とタプル (Array and Tuple)", () => {
  test("配列の例", () => {
    const numbers: number[] = [1, 2, 3];
    expect(numbers.length).toBe(3);
    expect(numbers[0]).toBe(1);
  });

  test("タプルの例", () => {
    const tuple: [string, number] = ["タイプスクリプト", 2024];
    expect(tuple[0]).toBe("タイプスクリプト");
    expect(tuple[1]).toBe(2024);
  });
});

// ユニオン型
describe("ユニオン型 (Union Types)", () => {
  test("ユニオン型の例", () => {
    let value: string | number;
    value = "文字列";
    expect(typeof value).toBe("string");
    value = 123;
    expect(typeof value).toBe("number");
  });
});

// リテラル型
describe("リテラル型 (Literal Types)", () => {
  test("リテラル型の例", () => {
    type Direction = "north" | "south" | "east" | "west";
    const move: Direction = "north"; // 許容されるリテラル値
    expect(move).toBe("north");
  });
});

// ジェネリクス
describe("ジェネリクス (Generics)", () => {
  test("ジェネリクス関数の例", () => {
    const identity = <T>(value: T): T => value;

    expect(identity<string>("タイプスクリプト")).toBe("タイプスクリプト");
    expect(identity<number>(42)).toBe(42);
  });

  test("ジェネリクス型の例", () => {
    interface Box<T> {
      value: T;
    }

    const stringBox: Box<string> = { value: "文字列" };
    const numberBox: Box<number> = { value: 42 };

    expect(stringBox.value).toBe("文字列");
    expect(numberBox.value).toBe(42);
  });
});
