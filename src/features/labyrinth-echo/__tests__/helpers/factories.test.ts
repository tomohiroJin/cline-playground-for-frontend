/**
 * 迷宮の残響 - テスト用ファクトリ関数のテスト
 */
import {
  createTestPlayer,
  createTestMeta,
  createTestEvent,
  createTestFx,
  createTestDifficulty,
  createTestOutcome,
} from './factories';
import { FX_DEFAULTS } from '../../domain/models/unlock';

describe('テスト用ファクトリ関数', () => {
  describe('createTestPlayer', () => {
    it('引数なしでデフォルト値のPlayerを返す', () => {
      // Act
      const player = createTestPlayer();

      // Assert
      expect(player.hp).toBe(55);
      expect(player.maxHp).toBe(55);
      expect(player.mn).toBe(35);
      expect(player.maxMn).toBe(35);
      expect(player.inf).toBe(5);
      expect(player.statuses).toEqual([]);
    });

    it('overridesで部分的にプロパティを上書きできる', () => {
      // Act
      const player = createTestPlayer({ hp: 30, statuses: ['呪い'] });

      // Assert
      expect(player.hp).toBe(30);
      expect(player.maxHp).toBe(55);
      expect(player.statuses).toEqual(['呪い']);
    });
  });

  describe('createTestMeta', () => {
    it('引数なしでデフォルト値のMetaStateを返す', () => {
      // Act
      const meta = createTestMeta();

      // Assert
      expect(meta.runs).toBe(0);
      expect(meta.escapes).toBe(0);
      expect(meta.kp).toBe(0);
      expect(meta.unlocked).toEqual([]);
      expect(meta.bestFloor).toBe(0);
      expect(meta.totalEvents).toBe(0);
      expect(meta.endings).toEqual([]);
      expect(meta.clearedDifficulties).toEqual([]);
      expect(meta.totalDeaths).toBe(0);
      expect(meta.lastRun).toBeNull();
      expect(meta.activeTitle).toBeNull();
    });

    it('overridesで部分的にプロパティを上書きできる', () => {
      // Act
      const meta = createTestMeta({ runs: 5, kp: 30 });

      // Assert
      expect(meta.runs).toBe(5);
      expect(meta.kp).toBe(30);
      expect(meta.escapes).toBe(0);
    });
  });

  describe('createTestEvent', () => {
    it('引数なしでデフォルト値のGameEventを返す', () => {
      // Act
      const event = createTestEvent();

      // Assert
      expect(event.id).toBe('test001');
      expect(event.fl).toEqual([1]);
      expect(event.tp).toBe('exploration');
      expect(event.sit).toBeDefined();
      expect(event.ch.length).toBeGreaterThan(0);
      expect(event.ch[0].t).toBeDefined();
      expect(event.ch[0].o.length).toBeGreaterThan(0);
    });

    it('overridesで部分的にプロパティを上書きできる', () => {
      // Act
      const event = createTestEvent({ id: 'custom001', fl: [2, 3] });

      // Assert
      expect(event.id).toBe('custom001');
      expect(event.fl).toEqual([2, 3]);
      expect(event.tp).toBe('exploration');
    });
  });

  describe('createTestFx', () => {
    it('引数なしでデフォルトのFxStateを返す', () => {
      // Act
      const fx = createTestFx();

      // Assert
      expect(fx).toEqual(FX_DEFAULTS);
    });

    it('overridesで部分的にプロパティを上書きできる', () => {
      // Act
      const fx = createTestFx({ dangerSense: true, hpBonus: 10 });

      // Assert
      expect(fx.dangerSense).toBe(true);
      expect(fx.hpBonus).toBe(10);
      expect(fx.healMult).toBe(1);
    });
  });

  describe('createTestDifficulty', () => {
    it('引数なしでnormal難易度ベースのDifficultyDefを返す', () => {
      // Act
      const diff = createTestDifficulty();

      // Assert
      expect(diff.id).toBe('normal');
      expect(diff.modifiers.dmgMult).toBe(1);
      expect(diff.modifiers.hpMod).toBe(0);
      expect(diff.modifiers.mnMod).toBe(0);
    });

    it('overridesで部分的にプロパティを上書きできる', () => {
      // Act
      const diff = createTestDifficulty({ id: 'hard', modifiers: { dmgMult: 1.35 } });

      // Assert
      expect(diff.id).toBe('hard');
      expect(diff.modifiers.dmgMult).toBe(1.35);
      expect(diff.name).toBe('挑戦者');
    });
  });

  describe('createTestOutcome', () => {
    it('引数なしでデフォルト値のOutcomeを返す', () => {
      // Act
      const outcome = createTestOutcome();

      // Assert
      expect(outcome.c).toBe('default');
      expect(outcome.r).toBeDefined();
      expect(outcome.hp).toBe(0);
      expect(outcome.mn).toBe(0);
      expect(outcome.inf).toBe(0);
    });

    it('overridesで部分的にプロパティを上書きできる', () => {
      // Act
      const outcome = createTestOutcome({ hp: -10, fl: 'add:呪い' });

      // Assert
      expect(outcome.hp).toBe(-10);
      expect(outcome.fl).toBe('add:呪い');
      expect(outcome.c).toBe('default');
    });
  });
});
