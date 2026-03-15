/**
 * CombatService（戦闘計算サービス）のテスト
 */
import {
  applyModifiers,
  applyChangesToPlayer,
  computeDrain,
  classifyImpact,
  checkSecondLife,
} from '../../../domain/services/combat-service';
import { createTestPlayer, createTestFx, createTestOutcome, createTestDifficulty } from '../../helpers/factories';
import type { StatusEffectId } from '../../../domain/models/player';

describe('CombatService', () => {
  describe('applyModifiers', () => {
    describe('正常系', () => {
      it('回復効果にhealMultが乗算される', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: 10 });
        const fx = createTestFx({ healMult: 1.5 });

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.hp).toBe(15);
      });

      it('HPダメージにhpReduceが乗算される', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: -20 });
        const fx = createTestFx({ hpReduce: 0.5 });

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.hp).toBe(-10);
      });

      it('MNダメージにmnReduceが乗算される', () => {
        // Arrange
        const outcome = createTestOutcome({ mn: -10 });
        const fx = createTestFx({ mnReduce: 0.5 });

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.mn).toBe(-5);
      });

      it('情報値にinfoMultが乗算される', () => {
        // Arrange
        const outcome = createTestOutcome({ inf: 10 });
        const fx = createTestFx({ infoMult: 1.5 });

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.inf).toBe(15);
      });

      it('呪い状態で情報値が半減する', () => {
        // Arrange
        const outcome = createTestOutcome({ inf: 10 });
        const fx = createTestFx();
        const statuses: StatusEffectId[] = ['呪い'];

        // Act
        const result = applyModifiers(outcome, fx, null, statuses);

        // Assert
        expect(result.inf).toBe(5);
      });
    });

    describe('難易度修正', () => {
      it('dmgMultがHPダメージに適用される', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: -10 });
        const fx = createTestFx();
        const diff = createTestDifficulty({ dmgMult: 1.5 });

        // Act
        const result = applyModifiers(outcome, fx, diff, []);

        // Assert
        expect(result.hp).toBe(-15);
      });

      it('dmgMultがMNダメージに適用される', () => {
        // Arrange
        const outcome = createTestOutcome({ mn: -10 });
        const fx = createTestFx();
        const diff = createTestDifficulty({ dmgMult: 2 });

        // Act
        const result = applyModifiers(outcome, fx, diff, []);

        // Assert
        expect(result.mn).toBe(-20);
      });

      it('dmgMult=1の場合はダメージが変化しない', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: -10 });
        const fx = createTestFx();
        const diff = createTestDifficulty({ dmgMult: 1 });

        // Act
        const result = applyModifiers(outcome, fx, diff, []);

        // Assert
        expect(result.hp).toBe(-10);
      });
    });

    describe('境界値', () => {
      it('HP変更が0の場合、修正値は適用されない', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: 0 });
        const fx = createTestFx({ healMult: 2.0, hpReduce: 0.5 });

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.hp).toBe(0);
      });

      it('全ての値がundefinedの場合は0になる', () => {
        // Arrange
        const outcome = createTestOutcome({});
        const fx = createTestFx();

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.hp).toBe(0);
        expect(result.mn).toBe(0);
        expect(result.inf).toBe(0);
      });
    });
  });

  describe('applyChangesToPlayer', () => {
    describe('正常系', () => {
      it('HPダメージが適用される', () => {
        // Arrange
        const player = createTestPlayer({ hp: 50, maxHp: 55 });

        // Act
        const result = applyChangesToPlayer(player, { hp: -10, mn: 0, inf: 0 }, null);

        // Assert
        expect(result.hp).toBe(40);
      });

      it('状態異常が追加される', () => {
        // Arrange
        const player = createTestPlayer({ st: [] });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:負傷');

        // Assert
        expect(result.st).toContain('負傷');
      });

      it('状態異常が除去される', () => {
        // Arrange
        const player = createTestPlayer({ st: ['負傷', '混乱'] });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'remove:負傷');

        // Assert
        expect(result.st).not.toContain('負傷');
        expect(result.st).toContain('混乱');
      });
    });

    describe('境界値', () => {
      it('HPが0未満にならない', () => {
        // Arrange
        const player = createTestPlayer({ hp: 5, maxHp: 55 });

        // Act
        const result = applyChangesToPlayer(player, { hp: -100, mn: 0, inf: 0 }, null);

        // Assert
        expect(result.hp).toBe(0);
      });

      it('HPがmaxHpを超えない', () => {
        // Arrange
        const player = createTestPlayer({ hp: 50, maxHp: 55 });

        // Act
        const result = applyChangesToPlayer(player, { hp: 100, mn: 0, inf: 0 }, null);

        // Assert
        expect(result.hp).toBe(55);
      });

      it('INFが0未満にならない', () => {
        // Arrange
        const player = createTestPlayer({ inf: 3 });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: -100 }, null);

        // Assert
        expect(result.inf).toBe(0);
      });
    });
  });

  describe('computeDrain', () => {
    describe('正常系', () => {
      it('ドレインなしの場合はdrainがnullになる', () => {
        // Arrange
        const player = createTestPlayer({ st: [] });
        const fx = createTestFx({ drainImmune: true });

        // Act
        const result = computeDrain(player, fx, null);

        // Assert
        expect(result.drain).toBeNull();
      });

      it('出血ステータスでHPドレインが適用される', () => {
        // Arrange
        const player = createTestPlayer({ hp: 50, maxHp: 55, st: ['出血'] });
        const fx = createTestFx();

        // Act
        const result = computeDrain(player, fx, null);

        // Assert
        expect(result.drain).not.toBeNull();
        expect(result.drain!.hp).toBe(-5);
      });

      it('bleedReduceで出血ダメージが半減する', () => {
        // Arrange
        const player = createTestPlayer({ hp: 50, maxHp: 55, st: ['出血'] });
        const fx = createTestFx({ bleedReduce: true });

        // Act
        const result = computeDrain(player, fx, null);

        // Assert
        expect(result.drain!.hp).toBe(-2); // Math.round(-5 * 0.5) = -2
      });

      it('drainImmuneで精神ドレインが無効化される', () => {
        // Arrange
        const player = createTestPlayer({ st: [] });
        const fx = createTestFx({ drainImmune: true });
        const diff = createTestDifficulty({ drainMod: -3 });

        // Act
        const result = computeDrain(player, fx, diff);

        // Assert
        expect(result.drain).toBeNull();
      });
    });
  });

  describe('classifyImpact', () => {
    it('大ダメージ（hp < -15）の場合にbigDmgを返す', () => {
      expect(classifyImpact(-20, 0)).toBe('bigDmg');
    });

    it('通常ダメージ（hp < 0）の場合にdmgを返す', () => {
      expect(classifyImpact(-5, 0)).toBe('dmg');
    });

    it('精神ダメージ（mn < -10）の場合にdmgを返す', () => {
      expect(classifyImpact(0, -15)).toBe('dmg');
    });

    it('回復（hp > 0）の場合にhealを返す', () => {
      expect(classifyImpact(10, 0)).toBe('heal');
    });

    it('変化なしの場合にnullを返す', () => {
      expect(classifyImpact(0, 0)).toBeNull();
    });
  });

  describe('checkSecondLife', () => {
    it('HP=0でsecondLife有効かつ未使用の場合に復活する', () => {
      // Arrange
      const player = createTestPlayer({ hp: 0, maxHp: 60, mn: 20, maxMn: 40 });
      const fx = createTestFx({ secondLife: true });

      // Act
      const result = checkSecondLife(player, fx, false);

      // Assert
      expect(result.activated).toBe(true);
      expect(result.player.hp).toBe(30); // maxHp / 2
      expect(result.player.mn).toBe(20); // max(現在mn, maxMn/2)
    });

    it('MN=0でsecondLife有効かつ未使用の場合に復活する', () => {
      // Arrange
      const player = createTestPlayer({ hp: 30, maxHp: 60, mn: 0, maxMn: 40 });
      const fx = createTestFx({ secondLife: true });

      // Act
      const result = checkSecondLife(player, fx, false);

      // Assert
      expect(result.activated).toBe(true);
      expect(result.player.mn).toBe(20); // maxMn / 2
    });

    it('secondLife未取得の場合は復活しない', () => {
      // Arrange
      const player = createTestPlayer({ hp: 0, maxHp: 60 });
      const fx = createTestFx({ secondLife: false });

      // Act
      const result = checkSecondLife(player, fx, false);

      // Assert
      expect(result.activated).toBe(false);
    });

    it('使用済みの場合は復活しない', () => {
      // Arrange
      const player = createTestPlayer({ hp: 0, maxHp: 60 });
      const fx = createTestFx({ secondLife: true });

      // Act
      const result = checkSecondLife(player, fx, true);

      // Assert
      expect(result.activated).toBe(false);
    });

    it('HP/MNが0でない場合は発動しない', () => {
      // Arrange
      const player = createTestPlayer({ hp: 10, maxHp: 60, mn: 10, maxMn: 40 });
      const fx = createTestFx({ secondLife: true });

      // Act
      const result = checkSecondLife(player, fx, false);

      // Assert
      expect(result.activated).toBe(false);
    });
  });
});
