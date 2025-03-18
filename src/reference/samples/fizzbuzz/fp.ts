const COUNT_WORDS: [number, string][] = [
  [3, "Fizz"],
  [5, "Buzz"],
];

export const fizzBuzz = (maxNumber: number): string[] =>
  Array.from({ length: maxNumber }, (_, index) => index + 1).map(
    (currentNumber) =>
      COUNT_WORDS.reduce<string>(
        (acc, [divisor, word]) =>
          currentNumber % divisor === 0 ? acc + word : acc,
        ""
      ) || String(currentNumber)
  );
