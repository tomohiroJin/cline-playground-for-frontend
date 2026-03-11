/**
 * domain/battle/battle-service のテスト
 */
import { startBattle, afterBattle } from '../../../domain/battle/battle-service';
import { RunStateBuilder } from '../../helpers/run-state-builder';

describe('domain/battle/battle-service', () => {
  describe('startBattle', () => {
    it('バトル開始時に敵が生成される', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .build();

      // Act
      const result = startBattle(run, false);

      // Assert
      expect(result.en).not.toBeNull();
      expect(result.cW).toBe(1);
      expect(result.log).toEqual([]);
    });

    it('エンドレスモードでスケーリングが適用される', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .withEndless({ isEndless: true, endlessWave: 2 })
        .withPlayer({ aM: 1 })
        .build();
      const normalRun = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .build();

      // Act
      const result = startBattle(run, false);
      const normalResult = startBattle(normalRun, false);

      // Assert
      expect(result.en).not.toBeNull();
      expect(result.en!.hp).toBeGreaterThan(normalResult.en!.hp);
    });

    it('チャレンジモードのenemyAtkMulが敵ATKに適用される', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .withChallenge({ enemyAtkMul: 2.0 })
        .build();
      const normalRun = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .build();

      // Act
      const challengeResult = startBattle(run, false);
      const normalResult = startBattle(normalRun, false);

      // Assert: チャレンジの敵ATKがノーマルより高い
      expect(challengeResult.en!.atk).toBeGreaterThan(normalResult.en!.atk);
    });

    it('enemyAtkMul=1の場合は敵ATKに変更がない', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .withChallenge({ enemyAtkMul: 1 })
        .build();
      const normalRun = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .build();

      // Act
      const result = startBattle(run, false);
      const normalResult = startBattle(normalRun, false);

      // Assert
      expect(result.en!.atk).toBe(normalResult.en!.atk);
    });

    it('ボス戦が発生する（cW > wpb）', () => {
      // Arrange: wpb=4, cW=4 → cW++で5 > 4 でボス
      const run = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 4, wpb: 4 })
        .build();

      // Act
      const result = startBattle(run, false);

      // Assert: ボスが生成される（cW=5 > wpb=4）
      expect(result.en).not.toBeNull();
      expect(result.cW).toBe(5);
    });

    it('wDmg/wTurn/logがリセットされる', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withProgression({ cB: 1 })
        .withBattle({ cW: 0 })
        .withStats({ wDmg: 100, wTurn: 10 })
        .withMeta({ log: [{ x: 'テスト', c: '#fff' }] })
        .build();

      // Act
      const result = startBattle(run, false);

      // Assert
      expect(result.wDmg).toBe(0);
      expect(result.wTurn).toBe(0);
      expect(result.log).toEqual([]);
    });
  });

  describe('afterBattle', () => {
    it('通常敵撃破時にバイオームクリアしない', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cW: 2, wpb: 4 })
        .build();

      // Act
      const { nextRun, biomeCleared } = afterBattle(run);

      // Assert
      expect(biomeCleared).toBe(false);
      expect(nextRun.btlCount).toBe(1);
    });

    it('ボス撃破時にバイオームクリアしHPが回復する', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cW: 5, wpb: 4 })
        .withPlayer({ hp: 50, mhp: 100 })
        .build();

      // Act
      const { nextRun, biomeCleared } = afterBattle(run);

      // Assert
      expect(biomeCleared).toBe(true);
      expect(nextRun.bc).toBe(1);
      expect(nextRun.cW).toBe(0);
      // HP回復: min(50 + floor(100*0.2), 100) = 70
      expect(nextRun.hp).toBe(70);
    });

    it('ボス撃破時のHP回復はmhpを超えない', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cW: 5, wpb: 4 })
        .withPlayer({ hp: 95, mhp: 100 })
        .build();

      // Act
      const { nextRun } = afterBattle(run);

      // Assert: 95 + 20 = 115 だが mhp=100 でクランプ
      expect(nextRun.hp).toBe(100);
    });

    it('スキルクールダウンがデクリメントされる', () => {
      // Arrange
      const run = RunStateBuilder.create()
        .withBattle({ cW: 2, wpb: 4 })
        .withSkills({ sk: { avl: ['fB'], cds: { fB: 3 }, bfs: [] } })
        .build();

      // Act
      const { nextRun } = afterBattle(run);

      // Assert
      expect(nextRun.sk.cds.fB).toBe(2);
    });
  });
});
