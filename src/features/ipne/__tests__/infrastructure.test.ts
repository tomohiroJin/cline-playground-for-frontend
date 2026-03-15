/**
 * インフラ実装のテスト
 * SequentialIdGenerator, MathRandomProvider, DateClockProvider の動作を検証
 */
import { SequentialIdGenerator } from '../infrastructure/id/SequentialIdGenerator';
import { MockIdGenerator } from './mocks/MockIdGenerator';
import { MockRandomProvider } from './mocks/MockRandomProvider';
import { MockClockProvider } from './mocks/MockClockProvider';

describe('SequentialIdGenerator', () => {
  let idGen: SequentialIdGenerator;

  beforeEach(() => {
    idGen = new SequentialIdGenerator();
  });

  describe('generateEnemyId', () => {
    it('連番のIDを生成する', () => {
      expect(idGen.generateEnemyId()).toBe('enemy-1');
      expect(idGen.generateEnemyId()).toBe('enemy-2');
      expect(idGen.generateEnemyId()).toBe('enemy-3');
    });
  });

  describe('generateTrapId', () => {
    it('連番のIDを生成する', () => {
      expect(idGen.generateTrapId()).toBe('trap-1');
      expect(idGen.generateTrapId()).toBe('trap-2');
    });
  });

  describe('generateItemId', () => {
    it('連番のIDを生成する', () => {
      expect(idGen.generateItemId()).toBe('item-1');
      expect(idGen.generateItemId()).toBe('item-2');
    });
  });

  describe('generateFeedbackId', () => {
    it('連番のIDを生成する', () => {
      expect(idGen.generateFeedbackId()).toBe('feedback-1');
      expect(idGen.generateFeedbackId()).toBe('feedback-2');
    });
  });

  describe('カウンタの独立性', () => {
    it('各プレフィックスのカウンタが独立している', () => {
      expect(idGen.generateEnemyId()).toBe('enemy-1');
      expect(idGen.generateTrapId()).toBe('trap-1');
      expect(idGen.generateItemId()).toBe('item-1');
      expect(idGen.generateEnemyId()).toBe('enemy-2');
      expect(idGen.generateTrapId()).toBe('trap-2');
    });
  });

  describe('reset', () => {
    it('全カウンタをリセットする', () => {
      idGen.generateEnemyId();
      idGen.generateTrapId();
      idGen.reset();
      expect(idGen.generateEnemyId()).toBe('enemy-1');
      expect(idGen.generateTrapId()).toBe('trap-1');
    });
  });
});

describe('MockIdGenerator', () => {
  it('指定したプレフィックスで連番IDを生成する', () => {
    const mock = new MockIdGenerator();
    expect(mock.generateEnemyId()).toBe('enemy-1');
    expect(mock.generateEnemyId()).toBe('enemy-2');
    expect(mock.generateTrapId()).toBe('trap-1');
    expect(mock.generateItemId()).toBe('item-1');
    expect(mock.generateFeedbackId()).toBe('feedback-1');
  });

  it('リセット後にカウンタが初期化される', () => {
    const mock = new MockIdGenerator();
    mock.generateEnemyId();
    mock.reset();
    expect(mock.generateEnemyId()).toBe('enemy-1');
  });
});

describe('MockRandomProvider', () => {
  it('固定値を返す', () => {
    const mock = new MockRandomProvider(0.5);
    expect(mock.random()).toBe(0.5);
    expect(mock.random()).toBe(0.5);
  });

  it('連続した値を返す', () => {
    const mock = new MockRandomProvider([0.1, 0.9, 0.5]);
    expect(mock.random()).toBe(0.1);
    expect(mock.random()).toBe(0.9);
    expect(mock.random()).toBe(0.5);
    // 配列が尽きたら最後の値を繰り返す
    expect(mock.random()).toBe(0.5);
  });

  it('randomInt が正しい範囲の整数を返す', () => {
    const mock = new MockRandomProvider(0.5);
    const result = mock.randomInt(0, 10);
    expect(result).toBe(5);
  });

  it('pick が配列から要素を返す', () => {
    const mock = new MockRandomProvider(0.0);
    expect(mock.pick([10, 20, 30])).toBe(10);
  });

  it('shuffle が新しい配列を返す', () => {
    const mock = new MockRandomProvider(0.5);
    const arr = [1, 2, 3];
    const result = mock.shuffle(arr);
    expect(result).toHaveLength(3);
    expect(result).not.toBe(arr);
  });
});

describe('MockClockProvider', () => {
  it('固定時刻を返す', () => {
    const clock = new MockClockProvider(1000);
    expect(clock.now()).toBe(1000);
  });

  it('advance で時刻を進められる', () => {
    const clock = new MockClockProvider(1000);
    clock.advance(500);
    expect(clock.now()).toBe(1500);
  });

  it('set で時刻を直接設定できる', () => {
    const clock = new MockClockProvider(1000);
    clock.set(5000);
    expect(clock.now()).toBe(5000);
  });
});
