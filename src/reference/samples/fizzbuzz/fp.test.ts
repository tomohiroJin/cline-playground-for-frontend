import { fizzBuzz } from "./fp";

describe("fizzBuzz", () => {
  test("数を受け取り、その数を文字列で返す", () => {
    expect(fizzBuzz(1)).toEqual(["1"]);
  });

  test("3 の倍数の時に Fizz を返す", () => {
    expect(fizzBuzz(3)).toEqual(["1", "2", "Fizz"]);
  });

  test("5 の倍数の時に Buzz を返す", () => {
    expect(fizzBuzz(5)).toEqual(["1", "2", "Fizz", "4", "Buzz"]);
  });

  test("3 と 5 の両方の倍数の時に FizzBuzz を返す", () => {
    expect(fizzBuzz(15)).toEqual([
      "1",
      "2",
      "Fizz",
      "4",
      "Buzz",
      "Fizz",
      "7",
      "8",
      "Fizz",
      "Buzz",
      "11",
      "Fizz",
      "13",
      "14",
      "FizzBuzz",
    ]);
  });
});
