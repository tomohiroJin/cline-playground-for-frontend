/**
 * classes.test.ts
 * TypeScriptのクラスに関する基本的な例を含むテスト。
 * このテストでは、クラスの基本構造、コンストラクタ、プロパティとメソッド、継承、アクセス修飾子、
 * 静的メソッド、ゲッター・セッターの例を含みます。
 */

// クラスの基本
describe("クラスの基本 (Basic Class)", () => {
  test("クラスの定義とインスタンス化", () => {
    class Person {
      name: string;
      age: number;

      constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
      }

      greet(): string {
        return `こんにちは、${this.name}さん！`;
      }
    }

    const person = new Person("太郎", 25);
    expect(person.name).toBe("太郎");
    expect(person.age).toBe(25);
    expect(person.greet()).toBe("こんにちは、太郎さん！");
  });
});

// 継承
describe("クラスの継承 (Class Inheritance)", () => {
  test("基本的な継承", () => {
    class Animal {
      name: string;

      constructor(name: string) {
        this.name = name;
      }

      sound(): string {
        return "動物の鳴き声";
      }
    }

    class Dog extends Animal {
      breed: string;

      constructor(name: string, breed: string) {
        super(name); // 親クラスのコンストラクタを呼び出す
        this.breed = breed;
      }

      sound(): string {
        return "ワンワン";
      }
    }

    const dog = new Dog("ポチ", "柴犬");
    expect(dog.name).toBe("ポチ");
    expect(dog.breed).toBe("柴犬");
    expect(dog.sound()).toBe("ワンワン");
  });
});

// アクセス修飾子
describe("アクセス修飾子 (Access Modifiers)", () => {
  test("public, private, protected の例", () => {
    class Person {
      public name: string; // どこからでもアクセス可能
      private age: number; // クラス内部からのみアクセス可能
      protected secret: string; // クラスとそのサブクラスからアクセス可能

      constructor(name: string, age: number, secret: string) {
        this.name = name;
        this.age = age;
        this.secret = secret;
      }

      public getAge(): number {
        return this.age;
      }
    }

    const person = new Person("花子", 20, "秘密");
    expect(person.name).toBe("花子");
    expect(person.getAge()).toBe(20);

    // 以下はコンパイルエラーとなる（コメントアウトで説明）
    // expect(person.age).toBe(20); // private のためアクセス不可
    // expect(person.secret).toBe('秘密'); // protected のためアクセス不可
  });
});

// 静的メソッドとプロパティ
describe("静的メソッドとプロパティ (Static Methods and Properties)", () => {
  test("static メソッドとプロパティ", () => {
    class MathUtils {
      static PI = 3.14;

      static add(a: number, b: number): number {
        return a + b;
      }
    }

    expect(MathUtils.PI).toBe(3.14);
    expect(MathUtils.add(2, 3)).toBe(5);
  });
});

// ゲッターとセッター
describe("ゲッターとセッター (Getters and Setters)", () => {
  test("ゲッターとセッターの例", () => {
    class Rectangle {
      private _width: number;
      private _height: number;

      constructor(width: number, height: number) {
        this._width = width;
        this._height = height;
      }

      get area(): number {
        return this._width * this._height;
      }

      set width(value: number) {
        if (value > 0) {
          this._width = value;
        }
      }

      set height(value: number) {
        if (value > 0) {
          this._height = value;
        }
      }
    }

    const rectangle = new Rectangle(10, 20);
    expect(rectangle.area).toBe(200);

    rectangle.width = 15;
    rectangle.height = 25;
    expect(rectangle.area).toBe(375);
  });
});
