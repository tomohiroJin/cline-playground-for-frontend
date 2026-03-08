/**
 * domain/event/event-service のテスト
 */
import {
  rollEvent, applyEventChoice, getEffectHintColor, getEffectHintIcon,
  formatEventResult, computeEventResult,
} from '../../../domain/event/event-service';
import { makeRun } from '../../test-helpers';
import type { EventChoice, EventEffect } from '../../../types';

describe('domain/event/event-service', () => {
  describe('rollEvent', () => {
    it('バトル回数が少ない場合はイベント発生しない', () => {
      const run = makeRun({ btlCount: 0 });
      expect(rollEvent(run, () => 0)).toBeUndefined();
    });

    it('確率チェックに失敗した場合はイベント発生しない', () => {
      const run = makeRun({ btlCount: 10 });
      // rngが1.0を返す（EVENT_CHANCEは0.25なので不発）
      expect(rollEvent(run, () => 1)).toBeUndefined();
    });

    it('条件を満たすとイベントが発生する', () => {
      const run = makeRun({ btlCount: 10 });
      // rngが0を返す（確率チェック通過 + 最初のイベント選択）
      const event = rollEvent(run, () => 0);
      expect(event).toBeDefined();
    });
  });

  describe('applyEventChoice', () => {
    it('stat_change効果を適用する', () => {
      const run = makeRun({ atk: 10 });
      const choice: EventChoice = {
        label: 'テスト',
        description: 'テスト説明',
        effect: { type: 'stat_change', stat: 'atk', value: 5 },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.atk).toBe(15);
      expect(result.eventCount).toBe(1);
    });

    it('heal効果を適用する', () => {
      const run = makeRun({ hp: 50, mhp: 100 });
      const choice: EventChoice = {
        label: 'テスト',
        description: 'テスト説明',
        effect: { type: 'heal', amount: 30 },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(80);
    });

    it('damage効果でHPが1未満にならない', () => {
      const run = makeRun({ hp: 5 });
      const choice: EventChoice = {
        label: 'テスト',
        description: 'テスト説明',
        effect: { type: 'damage', amount: 100 },
        riskLevel: 'dangerous',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(1);
    });

    it('nothing効果はステートを変更しない', () => {
      const run = makeRun();
      const choice: EventChoice = {
        label: 'テスト',
        description: 'テスト説明',
        effect: { type: 'nothing' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(run.hp);
      expect(result.eventCount).toBe(1);
    });
  });

  describe('getEffectHintColor', () => {
    it('heal効果で緑色を返す', () => {
      expect(getEffectHintColor({ type: 'heal', amount: 10 })).toBe('#50e090');
    });

    it('damage効果で赤色を返す', () => {
      expect(getEffectHintColor({ type: 'damage', amount: 10 })).toBe('#f05050');
    });
  });

  describe('getEffectHintIcon', () => {
    it('heal効果で💚を返す', () => {
      expect(getEffectHintIcon({ type: 'heal', amount: 10 })).toBe('💚');
    });
  });

  describe('formatEventResult', () => {
    it('heal効果のメッセージを生成する', () => {
      const result = formatEventResult({ type: 'heal', amount: 30 });
      expect(result.icon).toBe('💚');
      expect(result.text).toContain('30');
    });

    it('コスト情報を付記する', () => {
      const result = formatEventResult(
        { type: 'heal', amount: 30 },
        { type: 'hp_damage', amount: 10 },
      );
      expect(result.text).toContain('HP -10');
    });
  });

  describe('computeEventResult', () => {
    it('コストと効果を適用した結果を返す', () => {
      const run = makeRun({ hp: 80, mhp: 100, bE: 10 });
      const choice: EventChoice = {
        label: 'テスト',
        description: 'テスト説明',
        effect: { type: 'heal', amount: 20 },
        riskLevel: 'risky',
        cost: { type: 'bone', amount: 5 },
      };
      const { nextRun } = computeEventResult(run, choice);
      expect(nextRun.bE).toBe(5);
      expect(nextRun.hp).toBe(100);
    });
  });
});
