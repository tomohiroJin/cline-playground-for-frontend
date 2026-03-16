/**
 * ポートインターフェースのテスト
 * IdGenerator, RandomProvider, ClockProvider の契約を検証
 */
import { IdGenerator, RandomProvider, ClockProvider } from '../domain/ports';

describe('IdGenerator インターフェース', () => {
  describe('契約の検証', () => {
    it('generateEnemyId が "enemy-" プレフィックスの文字列を返す', () => {
      const idGen: IdGenerator = {
        generateEnemyId: () => 'enemy-1',
        generateTrapId: () => 'trap-1',
        generateItemId: () => 'item-1',
        generateFeedbackId: () => 'feedback-1',
      };
      expect(idGen.generateEnemyId()).toBe('enemy-1');
    });

    it('generateTrapId が "trap-" プレフィックスの文字列を返す', () => {
      const idGen: IdGenerator = {
        generateEnemyId: () => 'enemy-1',
        generateTrapId: () => 'trap-1',
        generateItemId: () => 'item-1',
        generateFeedbackId: () => 'feedback-1',
      };
      expect(idGen.generateTrapId()).toBe('trap-1');
    });

    it('generateItemId が "item-" プレフィックスの文字列を返す', () => {
      const idGen: IdGenerator = {
        generateEnemyId: () => 'enemy-1',
        generateTrapId: () => 'trap-1',
        generateItemId: () => 'item-1',
        generateFeedbackId: () => 'feedback-1',
      };
      expect(idGen.generateItemId()).toBe('item-1');
    });

    it('generateFeedbackId が "feedback-" プレフィックスの文字列を返す', () => {
      const idGen: IdGenerator = {
        generateEnemyId: () => 'enemy-1',
        generateTrapId: () => 'trap-1',
        generateItemId: () => 'item-1',
        generateFeedbackId: () => 'feedback-1',
      };
      expect(idGen.generateFeedbackId()).toBe('feedback-1');
    });
  });
});

describe('RandomProvider インターフェース', () => {
  describe('契約の検証', () => {
    it('random() が 0以上1未満の数値を返す', () => {
      const rng: RandomProvider = {
        random: () => 0.5,
        randomInt: () => 3,
        pick: <T>(arr: readonly T[]) => arr[0],
        shuffle: <T>(arr: readonly T[]) => [...arr],
      };
      const result = rng.random();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });

    it('randomInt(min, max) が min以上max未満の整数を返す', () => {
      const rng: RandomProvider = {
        random: () => 0.5,
        randomInt: (min, _max) => min,
        pick: <T>(arr: readonly T[]) => arr[0],
        shuffle: <T>(arr: readonly T[]) => [...arr],
      };
      const result = rng.randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThan(10);
    });

    it('pick() が配列から1要素を返す', () => {
      const items = ['a', 'b', 'c'];
      const rng: RandomProvider = {
        random: () => 0.5,
        randomInt: () => 1,
        pick: <T>(arr: readonly T[]) => arr[0],
        shuffle: (arr) => [...arr],
      };
      expect(items).toContain(rng.pick(items));
    });

    it('shuffle() が同じ長さの新しい配列を返す', () => {
      const items = [1, 2, 3, 4, 5];
      const rng: RandomProvider = {
        random: () => 0.5,
        randomInt: () => 1,
        pick: <T>(arr: readonly T[]) => arr[0],
        shuffle: <T>(arr: readonly T[]) => [...arr].reverse(),
      };
      const result = rng.shuffle(items);
      expect(result).toHaveLength(items.length);
      expect(result).not.toBe(items); // 新しい配列
    });
  });
});

describe('ClockProvider インターフェース', () => {
  describe('契約の検証', () => {
    it('now() が数値を返す', () => {
      const clock: ClockProvider = {
        now: () => 1000,
      };
      expect(typeof clock.now()).toBe('number');
    });
  });
});
