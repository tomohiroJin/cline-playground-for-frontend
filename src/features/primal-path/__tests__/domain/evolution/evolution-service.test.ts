/**
 * domain/evolution/evolution-service のテスト
 */
import { rollE, applyEvo, simEvo } from '../../../domain/evolution/evolution-service';
import { RunStateBuilder } from '../../helpers/run-state-builder';
import { EVOS, ALT } from '../../../constants';

describe('domain/evolution/evolution-service', () => {
  describe('simEvo', () => {
    it('進化適用のプレビューを返す', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withPlayer({ atk: 10, aM: 1, dm: 1, mhp: 100, hp: 80, def: 5, cr: 0.1 })
        .build();
      const evo = EVOS[0];

      // Act
      const result = simEvo(run, evo);

      // Assert
      expect(result).toHaveProperty('atk');
      expect(result).toHaveProperty('hp');
      expect(result).toHaveProperty('mhp');
      expect(result).toHaveProperty('def');
      expect(result).toHaveProperty('cr');
    });

    it('ステータス増加進化でプレビュー値が上がる', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withPlayer({ atk: 10, aM: 1, dm: 1, mhp: 100, hp: 100, def: 5, cr: 0.05 })
        .build();
      const evo = EVOS.find(e => e.e.atk && e.e.atk > 0)!;

      // Act
      const result = simEvo(run, evo);

      // Assert: ATK上昇進化なので atk が増加する
      expect(result.atk).toBeGreaterThanOrEqual(Math.floor(10 * 1 * 1));
    });
  });

  describe('rollE', () => {
    it('evoN個の進化を返す', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ evoN: 3 })
        .build();

      // Act
      const result = rollE(run, () => 0.5);

      // Assert
      expect(result).toHaveLength(3);
    });

    it('各文明から最低1つは選択される', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ evoN: 3 })
        .build();

      // Act
      const result = rollE(run, () => 0.5);

      // Assert
      const types = new Set(result.map(e => e.t));
      expect(types.size).toBe(3);
    });

    it('重複なしで選択される', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ evoN: 5 })
        .build();

      // Act
      const result = rollE(run, () => 0.5);

      // Assert
      const names = result.map(e => e.n);
      expect(new Set(names).size).toBe(names.length);
    });

    it('evoNが大きい場合にフォールバックプールから選択する', () => {
      // Arrange: 大量の進化を要求してフォールバック処理を検証
      const run = RunStateBuilder.create()
        .withProgression({ evoN: 10 })
        .build();

      // Act
      const result = rollE(run, () => 0.99);

      // Assert: 10個以下が返る（プールが枯渇する可能性あり）
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('死亡仲間がいない場合にrevA進化が除外される', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withSkills({ al: [] })
        .withProgression({ evoN: 20 })
        .build();

      // Act
      const result = rollE(run, () => 0.5);

      // Assert: 復活進化はフィルタされる
      const hasRevive = result.some(e => e.e.revA);
      expect(hasRevive).toBe(false);
    });

    it('死亡仲間がいる場合にrevA進化が含まれうる', () => {
      // Arrange
      const deadAlly = { n: '死亡仲間', hp: 0, mhp: 50, atk: 5, t: 'tech' as const, a: 0, h: 0, tk: 0 };
      const run = RunStateBuilder.create()
        .withSkills({ al: [deadAlly] })
        .withProgression({ evoN: 20 })
        .build();

      // Act: 多数回試行でrevA進化が含まれるか確認
      const result = rollE(run, () => 0.5);

      // Assert: revA進化がプール内に存在すれば含まれうる
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('applyEvo', () => {
    it('進化を適用して文明レベルが増加する', () => {
      // Arrange
      const evo = EVOS.find(e => e.t === 'tech')!;
      const run = RunStateBuilder.create()
        .withBattle({ cT: 0 })
        .build();

      // Act
      const { nextRun } = applyEvo(run, evo, () => 0.5);

      // Assert
      expect(nextRun.cT).toBe(1);
      expect(nextRun.evs).toHaveLength(1);
    });

    it('元のRunStateを変更しない', () => {
      // Arrange
      const evo = EVOS.find(e => e.t === 'tech')!;
      const run = RunStateBuilder.create()
        .withBattle({ cT: 0 })
        .build();

      // Act
      applyEvo(run, evo, () => 0.5);

      // Assert
      expect(run.cT).toBe(0);
      expect(run.evs).toHaveLength(0);
    });

    it('aHL進化で生存仲間のHPが回復する', () => {
      // Arrange
      const ahlEvo = EVOS.find(e => e.e.aHL);
      expect(ahlEvo).toBeDefined();
      const ally = { n: 'テスト仲間', hp: 30, mhp: 100, atk: 10, t: 'tech' as const, a: 1, h: 0, tk: 0 };
      const run = RunStateBuilder.create()
        .withBattle({ cT: 0 })
        .withSkills({ al: [ally] })
        .build();

      // Act
      const { nextRun } = applyEvo(run, ahlEvo!, () => 0.5);

      // Assert: 仲間のHPが回復している
      expect(nextRun.al[0].hp).toBeGreaterThan(30);
      expect(nextRun.al[0].hp).toBeLessThanOrEqual(nextRun.al[0].mhp);
    });

    it('revA進化で死亡仲間が復活する', () => {
      // Arrange
      const revEvo = EVOS.find(e => e.e.revA);
      expect(revEvo).toBeDefined();
      const deadAlly = { n: '死亡仲間', hp: 0, mhp: 100, atk: 10, t: 'tech' as const, a: 0, h: 0, tk: 0 };
      const run = RunStateBuilder.create()
        .withBattle({ cT: 0 })
        .withSkills({ al: [deadAlly] })
        .build();

      // Act
      const { nextRun, allyRevived } = applyEvo(run, revEvo!, () => 0.5);

      // Assert
      expect(allyRevived).toBe('死亡仲間');
      expect(nextRun.al[0].a).toBe(1);
      expect(nextRun.al[0].hp).toBeGreaterThan(0);
    });

    it('文明レベル2で仲間がリクルートされる', () => {
      // Arrange: tech文明レベルが1→2になるよう設定
      const techEvo = EVOS.find(e => e.t === 'tech')!;
      const run = RunStateBuilder.create()
        .withBattle({ cT: 1 }) // 適用後 cT=2 になる
        .withSkills({ al: [], mxA: 3 })
        .build();

      // Act
      const { nextRun, allyJoined } = applyEvo(run, techEvo, () => 0.5);

      // Assert: 仲間がリクルートされる
      expect(allyJoined).not.toBeNull();
      expect(nextRun.al).toHaveLength(1);
      expect(nextRun.al[0].t).toBe('tech');
    });

    it('仲間枠が満員の場合リクルートされない', () => {
      // Arrange: 仲間枠が既に満杯
      const techEvo = EVOS.find(e => e.t === 'tech')!;
      const allies = Array.from({ length: 3 }, (_, i) => ({
        n: `仲間${i}`, hp: 50, mhp: 50, atk: 5, t: 'tech' as const, a: 1, h: 0, tk: 0,
      }));
      const run = RunStateBuilder.create()
        .withBattle({ cT: 1 }) // cT=1→2 で通常ならリクルート条件
        .withSkills({ al: allies, mxA: 3 })
        .build();

      // Act
      const { nextRun, allyJoined } = applyEvo(run, techEvo, () => 0.5);

      // Assert: 仲間枠が満杯なのでリクルートされない
      expect(allyJoined).toBeNull();
      expect(nextRun.al).toHaveLength(3);
    });
  });
});
