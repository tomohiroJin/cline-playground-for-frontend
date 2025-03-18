import { FizzBuzz } from "./oo";

describe("FizzBuzz", () => {
  test("数字を受け取り、その数を文字列で返す", () => {
    // Arrange
    const fizzBuzz = new FizzBuzz();
    // Act
    const actual = fizzBuzz.convert(1);
    // Assert
    expect(actual).toEqual(["1"]);
  });

  test("3 の倍数の時に Fizz を返す", () => {
    // Arrange
    const fizzBuzz = new FizzBuzz();
    // Act
    const actual = fizzBuzz.convert(3);
    // Assert
    expect(actual).toEqual(["1", "2", "Fizz"]);
  });

  test("5 の倍数の時に Buzz を返す", () => {
    // Arrange
    const fizzBuzz = new FizzBuzz();
    // Act
    const actual = fizzBuzz.convert(5);
    // Assert
    expect(actual).toEqual(["1", "2", "Fizz", "4", "Buzz"]);
  });

  test("3 と 5 の両方の倍数の時に FizzBuzz を返す", () => {
    // Arrange
    const fizzBuzz = new FizzBuzz();
    // Act
    const actual = fizzBuzz.convert(15);
    // Assert
    expect(actual).toEqual([
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
