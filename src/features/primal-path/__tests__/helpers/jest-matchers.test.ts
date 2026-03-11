/**
 * カスタム Jest マッチャーのテスト
 */
import './jest-matchers';
import { RunStateBuilder } from './run-state-builder';
import type { Enemy } from '../../types/units';

const mockEnemy: Enemy = {
  n: 'テスト敵', hp: 50, mhp: 50, atk: 5, def: 0, bone: 10,
};

describe('カスタムマッチャー', () => {
  describe('toHavePlayerHp', () => {
    it('HP が期待値と一致する場合にパスする', () => {
      const run = RunStateBuilder.create().withPlayer({ hp: 50 }).build();

      expect(run).toHavePlayerHp(50);
    });

    it('HP が期待値と一致しない場合に失敗する', () => {
      const run = RunStateBuilder.create().withPlayer({ hp: 50 }).build();

      expect(() => expect(run).toHavePlayerHp(30)).toThrow();
    });

    it('.not で否定が動作する', () => {
      const run = RunStateBuilder.create().withPlayer({ hp: 50 }).build();

      expect(run).not.toHavePlayerHp(30);
    });
  });

  describe('toHaveKills', () => {
    it('キル数が期待値と一致する場合にパスする', () => {
      const run = RunStateBuilder.create().withStats({ kills: 10 }).build();

      expect(run).toHaveKills(10);
    });

    it('キル数が期待値と一致しない場合に失敗する', () => {
      const run = RunStateBuilder.create().withStats({ kills: 10 }).build();

      expect(() => expect(run).toHaveKills(5)).toThrow();
    });
  });

  describe('toHavePlayerState', () => {
    it('指定したプレイヤーステートの部分一致を検証する', () => {
      const run = RunStateBuilder.create()
        .withPlayer({ hp: 50, mhp: 100, atk: 20 })
        .build();

      expect(run).toHavePlayerState({ hp: 50, mhp: 100 });
    });

    it('一部が一致しない場合に失敗する', () => {
      const run = RunStateBuilder.create()
        .withPlayer({ hp: 50, mhp: 100 })
        .build();

      expect(() => expect(run).toHavePlayerState({ hp: 30 })).toThrow();
    });
  });

  describe('toBeBattleActive', () => {
    it('敵が存在する場合にパスする', () => {
      const run = RunStateBuilder.create()
        .withBattle({ en: mockEnemy })
        .build();

      expect(run).toBeBattleActive();
    });

    it('敵が null の場合に失敗する', () => {
      const run = RunStateBuilder.create()
        .withBattle({ en: null })
        .build();

      expect(() => expect(run).toBeBattleActive()).toThrow();
    });

    it('.not で否定が動作する', () => {
      const run = RunStateBuilder.create()
        .withBattle({ en: null })
        .build();

      expect(run).not.toBeBattleActive();
    });
  });
});
