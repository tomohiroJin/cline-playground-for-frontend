/**
 * 条件評価システムのテスト
 *
 * parseCondition / evaluateCondition / evalCondCompat の振る舞いを検証する。
 *
 * 修正内容（TDD対応）:
 * - evalCondCompat の不正条件文字列テスト: true → false に変更
 * - parseCondition の不正 statusId テスト: isStatusEffectId で検証するための新規テスト追加
 */
import {
  parseCondition,
  evaluateCondition,
  evalCondCompat,
} from '../../../domain/events/condition';
import type { Condition } from '../../../domain/events/condition';
import { createTestPlayer, createTestFx } from '../../helpers/factories';

// --- ヘルパー ---
// 共通ファクトリを使用し、このテスト固有のデフォルト値を設定
const makePlayer = (overrides: Parameters<typeof createTestPlayer>[0] = {}) =>
  createTestPlayer({ hp: 50, maxHp: 100, mn: 30, maxMn: 60, inf: 10, ...overrides });

// createTestFx を直接使用（不要なエイリアスを排除）
const makeFx = (overrides: Parameters<typeof createTestFx>[0] = {}) => createTestFx(overrides);

// =============================================================================
// parseCondition
// =============================================================================
describe('parseCondition', () => {
  describe('default 条件', () => {
    it('"default" を default条件にパースする', () => {
      const result = parseCondition('default');
      expect(result).toEqual({ type: 'default' });
    });
  });

  describe('status 条件', () => {
    it('"status:負傷" を status条件にパースする', () => {
      const result = parseCondition('status:負傷');
      expect(result).toEqual({ type: 'status', statusId: '負傷' });
    });

    it('"status:混乱" を status条件にパースする', () => {
      const result = parseCondition('status:混乱');
      expect(result).toEqual({ type: 'status', statusId: '混乱' });
    });

    describe('不正な statusId', () => {
      beforeEach(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
      afterEach(() => { jest.restoreAllMocks(); });

      it('"status:unknownStatus" の場合にエラーを投げる', () => {
        // Arrange: isStatusEffectId で検証されるため、不正な ID はエラーになる
        // Act & Assert
        expect(() => parseCondition('status:unknownStatus')).toThrow();
      });
    });
  });

  describe('hp 条件', () => {
    it('"hp>30" をhp条件にパースする', () => {
      const result = parseCondition('hp>30');
      expect(result).toEqual({ type: 'hp', op: '>', value: 30 });
    });

    it('"hp<20" をhp条件にパースする', () => {
      const result = parseCondition('hp<20');
      expect(result).toEqual({ type: 'hp', op: '<', value: 20 });
    });
  });

  describe('mn 条件', () => {
    it('"mn>25" をmn条件にパースする', () => {
      const result = parseCondition('mn>25');
      expect(result).toEqual({ type: 'mn', op: '>', value: 25 });
    });

    it('"mn<10" をmn条件にパースする', () => {
      const result = parseCondition('mn<10');
      expect(result).toEqual({ type: 'mn', op: '<', value: 10 });
    });
  });

  describe('inf 条件', () => {
    it('"inf>5" をinf条件にパースする', () => {
      const result = parseCondition('inf>5');
      expect(result).toEqual({ type: 'inf', op: '>', value: 5 });
    });

    it('"inf<15" をinf条件にパースする', () => {
      const result = parseCondition('inf<15');
      expect(result).toEqual({ type: 'inf', op: '<', value: 15 });
    });
  });

  describe('不正な条件文字列', () => {
    beforeEach(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
    afterEach(() => { jest.restoreAllMocks(); });
    it('空文字列でエラーを投げる', () => {
      expect(() => parseCondition('')).toThrow();
    });

    it('不明な形式でエラーを投げる', () => {
      expect(() => parseCondition('unknown:foo')).toThrow();
    });

    it('数値が不正な場合にエラーを投げる', () => {
      expect(() => parseCondition('hp>abc')).toThrow();
    });

    it('演算子がない場合にエラーを投げる', () => {
      expect(() => parseCondition('hp30')).toThrow();
    });
  });
});

// =============================================================================
// evaluateCondition
// =============================================================================
describe('evaluateCondition', () => {
  describe('default条件', () => {
    it('常にtrueを返す', () => {
      const condition: Condition = { type: 'default' };
      const player = makePlayer();
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });
  });

  describe('status条件', () => {
    it('プレイヤーが該当ステータスを持つ場合にtrueを返す', () => {
      const condition: Condition = { type: 'status', statusId: '負傷' };
      const player = makePlayer({ statuses: ['負傷'] });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('プレイヤーが該当ステータスを持たない場合にfalseを返す', () => {
      const condition: Condition = { type: 'status', statusId: '負傷' };
      const player = makePlayer({ statuses: [] });
      expect(evaluateCondition(condition, player, makeFx())).toBe(false);
    });

    it('複数ステータスの中から一致を検出する', () => {
      const condition: Condition = { type: 'status', statusId: '混乱' };
      const player = makePlayer({ statuses: ['負傷', '混乱', '恐怖'] });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });
  });

  describe('hp条件', () => {
    it('hp > thresholdが真の場合にtrueを返す', () => {
      const condition: Condition = { type: 'hp', op: '>', value: 30 };
      const player = makePlayer({ hp: 50 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('hp > thresholdが偽の場合にfalseを返す', () => {
      const condition: Condition = { type: 'hp', op: '>', value: 60 };
      const player = makePlayer({ hp: 50 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(false);
    });

    it('hp < thresholdが真の場合にtrueを返す', () => {
      const condition: Condition = { type: 'hp', op: '<', value: 60 };
      const player = makePlayer({ hp: 50 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('hp < thresholdが偽の場合にfalseを返す', () => {
      const condition: Condition = { type: 'hp', op: '<', value: 30 };
      const player = makePlayer({ hp: 50 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(false);
    });

    describe('境界値', () => {
      it('hpとthresholdが同じ場合、hp > thresholdはfalse', () => {
        const condition: Condition = { type: 'hp', op: '>', value: 50 };
        const player = makePlayer({ hp: 50 });
        expect(evaluateCondition(condition, player, makeFx())).toBe(false);
      });

      it('hpとthresholdが同じ場合、hp < thresholdはfalse', () => {
        const condition: Condition = { type: 'hp', op: '<', value: 50 };
        const player = makePlayer({ hp: 50 });
        expect(evaluateCondition(condition, player, makeFx())).toBe(false);
      });
    });
  });

  describe('mn条件', () => {
    it('mn > thresholdが真の場合にtrueを返す', () => {
      const condition: Condition = { type: 'mn', op: '>', value: 20 };
      const player = makePlayer({ mn: 30 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('mn < thresholdが真の場合にtrueを返す', () => {
      const condition: Condition = { type: 'mn', op: '<', value: 40 };
      const player = makePlayer({ mn: 30 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });
  });

  describe('inf条件', () => {
    it('inf > thresholdが真の場合にtrueを返す', () => {
      const condition: Condition = { type: 'inf', op: '>', value: 5 };
      const player = makePlayer({ inf: 10 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('inf < thresholdが真の場合にtrueを返す', () => {
      const condition: Condition = { type: 'inf', op: '<', value: 15 };
      const player = makePlayer({ inf: 10 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });
  });

  // FX効果の適用テスト
  describe('FX効果', () => {
    describe('dangerSense', () => {
      it('hp < 30 かつ dangerSense有効時、hpに+20のボーナスが適用される', () => {
        const condition: Condition = { type: 'hp', op: '>', value: 30 };
        const player = makePlayer({ hp: 25, maxHp: 100 });
        const fx = makeFx({ dangerSense: true });
        expect(evaluateCondition(condition, player, fx)).toBe(true);
      });

      it('hp >= 30の場合、dangerSenseは適用されない', () => {
        const condition: Condition = { type: 'hp', op: '>', value: 35 };
        const player = makePlayer({ hp: 30, maxHp: 100 });
        const fx = makeFx({ dangerSense: true });
        expect(evaluateCondition(condition, player, fx)).toBe(false);
      });

      it('dangerSenseが無効の場合はボーナスが適用されない', () => {
        const condition: Condition = { type: 'hp', op: '>', value: 30 };
        const player = makePlayer({ hp: 25, maxHp: 100 });
        const fx = makeFx({ dangerSense: false });
        expect(evaluateCondition(condition, player, fx)).toBe(false);
      });

      it('hp < 条件にはdangerSenseは適用されない', () => {
        // hp=25, dangerSense有効でも、hp < 条件は素のhp値で比較
        const condition: Condition = { type: 'hp', op: '<', value: 50 };
        const player = makePlayer({ hp: 25, maxHp: 100 });
        const fx = makeFx({ dangerSense: true });
        expect(evaluateCondition(condition, player, fx)).toBe(true);
      });
    });

    describe('negotiator', () => {
      it('negotiator有効時、mnに+8のボーナスが適用される', () => {
        const condition: Condition = { type: 'mn', op: '>', value: 30 };
        const player = makePlayer({ mn: 25, maxMn: 60 });
        const fx = makeFx({ negotiator: true });
        expect(evaluateCondition(condition, player, fx)).toBe(true);
      });

      it('negotiator無効時はボーナスが適用されない', () => {
        const condition: Condition = { type: 'mn', op: '>', value: 30 };
        const player = makePlayer({ mn: 25, maxMn: 60 });
        const fx = makeFx({ negotiator: false });
        expect(evaluateCondition(condition, player, fx)).toBe(false);
      });
    });

    describe('mentalSense', () => {
      it('mn < 25 かつ mentalSense有効時、mnに+15のボーナスが適用される', () => {
        const condition: Condition = { type: 'mn', op: '>', value: 30 };
        const player = makePlayer({ mn: 20, maxMn: 60 });
        const fx = makeFx({ mentalSense: true });
        expect(evaluateCondition(condition, player, fx)).toBe(true);
      });

      it('mn >= 25の場合、mentalSenseは適用されない', () => {
        const condition: Condition = { type: 'mn', op: '>', value: 30 };
        const player = makePlayer({ mn: 25, maxMn: 60 });
        const fx = makeFx({ mentalSense: true });
        expect(evaluateCondition(condition, player, fx)).toBe(false);
      });
    });

    describe('negotiator + mentalSense複合', () => {
      it('両方有効かつ mn < 25の場合、+8と+15の両方が適用される', () => {
        const condition: Condition = { type: 'mn', op: '>', value: 30 };
        const player = makePlayer({ mn: 10, maxMn: 60 });
        const fx = makeFx({ negotiator: true, mentalSense: true });
        expect(evaluateCondition(condition, player, fx)).toBe(true);
      });
    });
  });
});

// =============================================================================
// evalCondCompat（後方互換ラッパー）
// =============================================================================
describe('evalCondCompat', () => {
  // invariant / console.warn のノイズを抑制
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { jest.restoreAllMocks(); });
  it('"default"でtrueを返す', () => {
    expect(evalCondCompat('default', makePlayer(), makeFx())).toBe(true);
  });

  it('"status:負傷"でステータスを持つ場合trueを返す', () => {
    const player = makePlayer({ statuses: ['負傷'] });
    expect(evalCondCompat('status:負傷', player, makeFx())).toBe(true);
  });

  it('"hp>30"でhp=50の場合trueを返す', () => {
    expect(evalCondCompat('hp>30', makePlayer({ hp: 50 }), makeFx())).toBe(true);
  });

  it('"hp<30"でhp=50の場合falseを返す', () => {
    expect(evalCondCompat('hp<30', makePlayer({ hp: 50 }), makeFx())).toBe(false);
  });

  it('"mn>20"でnegotiator有効時にボーナスが適用される', () => {
    // mn=18, negotiator(+8) -> 26 > 20 = true
    const player = makePlayer({ mn: 18, maxMn: 60 });
    const fx = makeFx({ negotiator: true });
    expect(evalCondCompat('mn>20', player, fx)).toBe(true);
  });

  it('"inf>5"でinf=10の場合trueを返す', () => {
    expect(evalCondCompat('inf>5', makePlayer({ inf: 10 }), makeFx())).toBe(true);
  });

  it('不正な条件文字列でfalseを返しwarnログを出力する', () => {
    // Arrange
    const player = makePlayer();
    const fx = makeFx();

    // Act
    const result = evalCondCompat('invalid', player, fx);

    // Assert — 安全側（false）に倒し、警告ログを出力
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[evalCondCompat]'),
      // warn は既に beforeEach でモック済み
    );
  });
});
