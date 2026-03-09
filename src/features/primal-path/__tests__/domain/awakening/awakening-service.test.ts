/**
 * domain/awakening/awakening-service のテスト
 */
import { checkAwakeningRules, applyAwkFx, awkInfo } from '../../../domain/awakening/awakening-service';
import { RunStateBuilder } from '../../helpers/run-state-builder';
import type { EvoEffect } from '../../../types';

describe('domain/awakening/awakening-service', () => {
  describe('checkAwakeningRules', () => {
    it('全文明レベル3以上で調和・小が解除可能になる', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cT: 3, cL: 3, cR: 3 })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const rule = checkAwakeningRules(run);

      // Assert
      expect(rule).not.toBeNull();
      expect(rule!.id).toBe('sa_bal');
    });

    it('条件を満たしていない場合はnullを返す', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cT: 1, cL: 1, cR: 1 })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const rule = checkAwakeningRules(run);

      // Assert
      expect(rule).toBeNull();
    });

    it('既に解除済みの覚醒はスキップする', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cT: 3, cL: 3, cR: 3 })
        .withAwakening({ awoken: [{ id: 'sa_bal', nm: '調和・小', cl: '#e0c060' }] })
        .build();

      // Act
      const rule = checkAwakeningRules(run);

      // Assert
      expect(rule === null || rule.id !== 'sa_bal').toBe(true);
    });

    it('特定文明の覚醒条件を満たした場合にその文明覚醒を返す', () => {
      // Arrange: tech文明がsaReq(4)以上、他は不十分
      const run = RunStateBuilder.create()
        .withBattle({ cT: 4, cL: 1, cR: 1 })
        .withAwakening({ awoken: [], saReq: 4 })
        .build();

      // Act
      const rule = checkAwakeningRules(run);

      // Assert
      expect(rule).not.toBeNull();
      expect(rule!.id).toBe('sa_tech');
      expect(rule!.t).toBe('tech');
    });

    it('大覚醒（fa_bal）の条件を判定する', () => {
      // Arrange: 全小覚醒済み + 全文明Lv4以上
      const run = RunStateBuilder.create()
        .withBattle({ cT: 4, cL: 4, cR: 4 })
        .withAwakening({
          awoken: [
            { id: 'sa_bal', nm: '調和・小', cl: '#e0c060' },
            { id: 'sa_tech', nm: 'テク・小', cl: '#60a0ff' },
            { id: 'sa_life', nm: 'ライフ・小', cl: '#60ff60' },
            { id: 'sa_rit', nm: 'リチュアル・小', cl: '#ff6060' },
          ],
          saReq: 4,
        })
        .build();

      // Act
      const rule = checkAwakeningRules(run);

      // Assert
      expect(rule).not.toBeNull();
      expect(rule!.id).toBe('fa_bal');
      expect(rule!.tier).toBe(2);
    });

    it('文明固有の大覚醒（fa_*）の条件を判定する', () => {
      // Arrange: tech文明がfReq(5)以上
      const run = RunStateBuilder.create()
        .withBattle({ cT: 5, cL: 1, cR: 1 })
        .withAwakening({ awoken: [], saReq: 4 })
        .withProgression({ fReq: 5 })
        .build();

      // Act
      const rule = checkAwakeningRules(run);

      // Assert: saの方が先に判定されるので sa_tech が返る
      expect(rule).not.toBeNull();
      expect(rule!.id).toBe('sa_tech');
    });
  });

  describe('applyAwkFx', () => {
    it('覚醒効果を適用して記録する', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withPlayer({ atk: 10 })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const result = applyAwkFx(run, { atk: 5 }, 'sa_tech', 'テク・小', '#60a0ff', null);

      // Assert
      expect(result.atk).toBe(15);
      expect(result.awoken).toHaveLength(1);
      expect(result.awoken[0].id).toBe('sa_tech');
    });

    it('元のRunStateを変更しない', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withPlayer({ atk: 10 })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      applyAwkFx(run, { atk: 5 }, 'sa_tech', 'テク・小', '#60a0ff', null);

      // Assert
      expect(run.atk).toBe(10);
      expect(run.awoken).toHaveLength(0);
    });

    it('allyAtkMulで生存仲間のATKが倍加する', () => {
      // Arrange
      const ally = { n: '仲間', hp: 50, mhp: 50, atk: 10, t: 'tech' as const, a: 1, h: 0, tk: 0 };
      const run = RunStateBuilder.create()
        .withSkills({ al: [ally] })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const result = applyAwkFx(run, { allyAtkMul: 2 } as unknown as EvoEffect, 'sa_tech', 'テク・小', '#60a0ff', null);

      // Assert
      expect(result.al[0].atk).toBe(20);
    });

    it('allyAtkMulは死亡仲間には適用されない', () => {
      // Arrange
      const deadAlly = { n: '死亡仲間', hp: 0, mhp: 50, atk: 10, t: 'tech' as const, a: 0, h: 0, tk: 0 };
      const run = RunStateBuilder.create()
        .withSkills({ al: [deadAlly] })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const result = applyAwkFx(run, { allyAtkMul: 2 } as unknown as EvoEffect, 'sa_tech', 'テク・小', '#60a0ff', null);

      // Assert: a=0（死亡）なので適用されない
      expect(result.al[0].atk).toBe(10);
    });

    it('allyFullHealで生存仲間のHPが全回復する', () => {
      // Arrange
      const ally = { n: '仲間', hp: 20, mhp: 100, atk: 10, t: 'tech' as const, a: 1, h: 0, tk: 0 };
      const run = RunStateBuilder.create()
        .withSkills({ al: [ally] })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const result = applyAwkFx(run, { allyFullHeal: 1 } as unknown as EvoEffect, 'sa_tech', 'テク・小', '#60a0ff', null);

      // Assert
      expect(result.al[0].hp).toBe(100);
    });

    it('feが指定された場合にfe状態を更新する', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ fe: null })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const result = applyAwkFx(run, {}, 'fa_tech', 'テク・大', '#60a0ff', 'tech');

      // Assert
      expect(result.fe).toBe('tech');
    });
  });

  describe('awkInfo', () => {
    it('次の覚醒候補を返す（最大3個）', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cT: 1, cL: 1, cR: 1 })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const info = awkInfo(run);

      // Assert
      expect(info.length).toBeLessThanOrEqual(3);
      expect(info.length).toBeGreaterThan(0);
    });

    it('調和・小が未解除でmnが3未満の場合に候補に含まれる', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cT: 1, cL: 1, cR: 1 })
        .withAwakening({ awoken: [] })
        .build();

      // Act
      const info = awkInfo(run);

      // Assert: 調和・小が候補に含まれる
      expect(info.some(i => i.nm === '調和・小')).toBe(true);
    });

    it('調和・大の候補が条件を満たす場合に表示される', () => {
      // Arrange: sa_bal解除済み、mn=3だがmn<4、sa文明覚醒も解除済み
      const run = RunStateBuilder.create()
        .withBattle({ cT: 3, cL: 3, cR: 3 })
        .withAwakening({
          awoken: [
            { id: 'sa_bal', nm: '調和・小', cl: '#e0c060' },
            { id: 'sa_tech', nm: 'テク・小', cl: '#60a0ff' },
            { id: 'sa_life', nm: 'ライフ・小', cl: '#60ff60' },
            { id: 'sa_rit', nm: 'リチュアル・小', cl: '#ff6060' },
          ],
          saReq: 3, // saReq=3 で全てのsa覚醒が条件クリア済み
        })
        .build();

      // Act
      const info = awkInfo(run);

      // Assert: 調和・大が候補に含まれる（mn=3 >= 3 && sa_bal解除済み && mn<4）
      expect(info.some(i => i.nm === '調和・大')).toBe(true);
    });
  });
});
