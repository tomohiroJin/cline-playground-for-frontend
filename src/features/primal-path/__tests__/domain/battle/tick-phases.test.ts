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

      it('復活の儀を保有していれば環境フェーズでの致死後に復活し同tickで敵を撃破する', () => {
        // Arrange:
        //   - glacier(環境ダメージ3)、hp=2で環境フェーズが致死（hp: 2-3=-1）
        //   - tb.rv=1 かつ rvU=0 により復活の儀が env フェーズ直後に発動し HP=floor(80*0.3)=24 に回復
        //   - 敵を hp=1/def=0 の弱設定にし、atk=100 で復活後の攻撃で確実に撃破
        //   → env直後の tickDeathCheck が除去された旧コードでは、負HPのまま
        //     敵撃破経路に進み resolveEnemyDefeat の ensureTickResult が例外を投げる
        const run = makeRun({
          cBT: 'glacier',
          hp: 2, mhp: 80,
          tb: { ...TB_DEFAULTS, rv: 1 },
          rvU: 0,
          en: { n: 'fragile', hp: 1, mhp: 1, atk: 1, def: 0, bone: 5 },
          atk: 100, aM: 1, dm: 1,
        });

        // Act
        const result = tick(run, false, () => 0.5);

        // Assert:
        //   - player_dead イベントが発火しない（復活の儀が機能している）
        //   - enemy_killed イベントが発火する（復活後に敵を撃破できている）
        //   - nextRun.hp が正（復活後の HP が維持されている）
        //   - 例外を投げない（ensureTickResult の事後条件を満たしている）
        expect(result.events.some(e => e.type === 'player_dead')).toBe(false);
        expect(result.events.some(e => e.type === 'enemy_killed')).toBe(true);
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

    describe('ボスの被ダメージ上限', () => {
      it('ボスは1ターンに最大HPの40%までしか削れず一撃で倒せない', () => {
        // Arrange: 最大HP1000のボス。プレイヤーは過剰火力だが上限で400までしか削れない
        const run = makeRun({
          en: { n: 'ボス', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 5, boss: true },
          atk: 100000, aM: 1, dm: 1,
        });

        // Act: rng=0.99 で会心を回避
        const result = tick(run, false, () => 0.99);

        // Assert: 1000 - floor(1000×0.4)=400 を下回らず、撃破されない
        expect(result.nextRun.en?.hp).toBe(600);
        expect(result.events.some(e => e.type === 'enemy_killed')).toBe(false);
      });

      it('非ボスは上限なしで一撃で倒せる', () => {
        const run = makeRun({
          en: { n: '雑魚', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 5 },
          atk: 100000, aM: 1, dm: 1,
        });
        const result = tick(run, false, () => 0.99);
        expect(result.events.some(e => e.type === 'enemy_killed')).toBe(true);
      });

      it('装甲ボスは装甲がある間は本体HPが減らず（装甲を削る）撃破できない', () => {
        // Arrange: 装甲1000のボス。過剰火力でも per-turn 上限400まで＝装甲が400吸収し本体HPは不変
        const run = makeRun({
          en: { n: '装甲ボス', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 5, boss: true, armor: 1000 },
          atk: 100000, aM: 1, dm: 1,
        });
        const result = tick(run, false, () => 0.99);
        expect(result.nextRun.en?.hp).toBe(1000);        // 本体HPは無傷
        expect(result.nextRun.en?.armor).toBe(600);      // 装甲 1000 - 上限400
        expect(result.events.some(e => e.type === 'enemy_killed')).toBe(false);
      });

      it('装甲を削り切るとブレイクし、以降は本体HPに通る', () => {
        // Arrange: 装甲を残り300にしておく。上限400 → 装甲300吸収しブレイク、余剰100が本体へ
        const run = makeRun({
          en: { n: '装甲ボス', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 5, boss: true, armor: 300 },
          atk: 100000, aM: 1, dm: 1,
        });
        const result = tick(run, false, () => 0.99);
        expect(result.nextRun.en?.armor).toBe(0);        // 装甲ブレイク
        expect(result.nextRun.en?.hp).toBe(900);         // 本体 1000 - 余剰100
        expect(result.nextRun.log.some(l => l.x.includes('ブレイク'))).toBe(true);
      });
    });
  });
});
