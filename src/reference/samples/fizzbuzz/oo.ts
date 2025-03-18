export class FizzBuzz {
  constructor() {}

  convert(num: number): string[] {
    return Array.from({ length: num }, (_, i) => {
      const n = i + 1;
      if (n % 3 === 0 && n % 5 === 0) {
        return "FizzBuzz";
      }
      if (n % 3 === 0) {
        return "Fizz";
      }
      if (n % 5 === 0) {
        return "Buzz";
      }
      return n.toString();
    });
  }
}
