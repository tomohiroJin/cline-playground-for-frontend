/**
 * domain/battle/tick-phases のテスト
 */
import { tick } from '../../../domain/battle/tick-phases';
import { makeRun } from '../../test-helpers';
import { TB_DEFAULTS } from '../../../constants';

describe('domain/battle/tick-phases', () => {
  describe('tick', () => {
    it('敵がいない場合は何もせずに返す', () => {
      const run = makeRun({ en: null });
      const result = tick(run, false, () => 0.5);
      expect(result.events).toEqual([]);
    });

    it('1ターンの戦闘でターン数が増加する', () => {
      const run = makeRun({
        en: { n: 'test', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 1 },
        atk: 10, aM: 1, dm: 1,
      });
      const result = tick(run, false, () => 0.5);
      expect(result.nextRun.turn).toBe(1);
      expect(result.nextRun.wTurn).toBe(1);
    });

    it('敵を倒した場合にenemy_killedイベントが発生する', () => {
      const run = makeRun({
        en: { n: 'weak', hp: 1, mhp: 1, atk: 1, def: 0, bone: 5 },
        atk: 100, aM: 1, dm: 1,
      });
      const result = tick(run, false, () => 0.5);
      expect(result.events.some(e => e.type === 'enemy_killed')).toBe(true);
      expect(result.nextRun.kills).toBe(1);
    });

    it('最終ボスモードで敵を倒した場合にfinal_boss_killedイベントが発生する', () => {
      const run = makeRun({
        en: { n: 'boss', hp: 1, mhp: 1, atk: 1, def: 0, bone: 10 },
        atk: 100, aM: 1, dm: 1,
      });
      const result = tick(run, true, () => 0.5);
      expect(result.events.some(e => e.type === 'final_boss_killed')).toBe(true);
    });

    it('元のRunStateを変更しない（イミュータビリティ）', () => {
      const run = makeRun({
        en: { n: 'test', hp: 100, mhp: 100, atk: 5, def: 0, bone: 1 },
        hp: 50, mhp: 80, atk: 10, aM: 1, dm: 1,
      });
      const originalHp = run.hp;
      tick(run, false, () => 0.5);
      expect(run.hp).toBe(originalHp);
    });

    describe('環境ダメージによる死亡判定', () => {
      it('環境ダメージが致死量のとき、そのtickでプレイヤーが死亡し敵は撃破されない', () => {
        // Arrange: 氷河バイオーム(環境ダメージ3)、HP2で必ず致死。敵は瀕死だが攻撃前に死ぬ
        const run = makeRun({
          cBT: 'glacier',
          hp: 2, mhp: 80,
          en: { n: 'weak', hp: 1, mhp: 1, atk: 1, def: 0, bone: 5 },
          atk: 100, aM: 1, dm: 1,
        });

        // Act
        const result = tick(run, false, () => 0.5);

        // Assert: プレイヤー死亡イベントが発火し、敵撃破は発火しない
        expect(result.events.some(e => e.type === 'player_dead')).toBe(true);
        expect(result.events.some(e => e.type === 'enemy_killed')).toBe(false);
        expect(result.nextRun.hp).toBe(0);
      });

      it('環境ダメージで負HPになる状況でも事後条件例外を投げない（回帰）', () => {
        // Arrange: 環境ダメージで負HP→同tickで敵撃破できる構成（旧バグの再現条件）
        const run = makeRun({
          cBT: 'glacier',
          hp: 2, mhp: 80,
          en: { n: 'weak', hp: 1, mhp: 1, atk: 1, def: 0, bone: 5 },
          atk: 100, aM: 1, dm: 1,
        });

        // Act / Assert: dev環境(NODE_ENV=test)でも ensureTickResult が例外を投げない
        expect(() => tick(run, false, () => 0.5)).not.toThrow();
      });

      it('復活の儀を保有していれば環境ダメージ致死でも発動し戦闘継続する', () => {
        // Arrange: tb.rv を有効化。環境ダメージで一度致死になっても復活する
        const run = makeRun({
          cBT: 'glacier',
          hp: 2, mhp: 80,
          tb: { ...TB_DEFAULTS, rv: 1 },
          rvU: 0,
          en: { n: 'tough', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 1 },
          atk: 10, aM: 1, dm: 1,
        });

        // Act
        const result = tick(run, false, () => 0.5);

        // Assert: 死亡せず、HPが正に復帰している
        expect(result.events.some(e => e.type === 'player_dead')).toBe(false);
        expect(result.nextRun.hp).toBeGreaterThan(0);
      });

      it('環境ダメージが非致死なら通常どおり戦闘が継続する', () => {
        // Arrange: 氷河(環境ダメージ3)だがHP80で生存。敵は硬く倒れない
        const run = makeRun({
          cBT: 'glacier',
          hp: 80, mhp: 80,
          en: { n: 'tough', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 1 },
          atk: 10, aM: 1, dm: 1,
        });

        // Act
        const result = tick(run, false, () => 0.5);

        // Assert: 死亡せずターンが進行し、環境ダメージ3＋敵攻撃1でHP76
        expect(result.events.some(e => e.type === 'player_dead')).toBe(false);
        expect(result.nextRun.turn).toBe(1);
        expect(result.nextRun.hp).toBe(76);
      });
    });
  });
});
