/**
 * CombatService（戦闘計算サービス）のテスト
 *
 * 修正内容（TDD対応）:
 * - classifyImpact の境界値テスト: CFG定数を使った閾値チェック
 * - applyChangesToPlayer のステータスフラグテスト: プレフィックス定数の間接確認
 * - applyModifiers の呪いペナルティテスト: CFG.CURSE_INFO_PENALTY の確認
 * - checkSecondLife の回復率テスト: CFG.SECOND_LIFE_RECOVER_RATE の確認
 */
import {
  applyModifiers,
  applyChangesToPlayer,
  computeDrain,
  classifyImpact,
  checkSecondLife,
} from '../../../domain/services/combat-service';
import { CFG } from '../../../domain/constants/config';
import { createDomainTestPlayer, createTestFx, createTestOutcome, createDomainTestDifficulty } from '../../helpers/factories';
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
        const diff = createDomainTestDifficulty({ modifiers: { dmgMult: 1.5 } });

        // Act
        const result = applyModifiers(outcome, fx, diff, []);

        // Assert
        expect(result.hp).toBe(-15);
      });

      it('dmgMultがMNダメージに適用される', () => {
        // Arrange
        const outcome = createTestOutcome({ mn: -10 });
        const fx = createTestFx();
        const diff = createDomainTestDifficulty({ modifiers: { dmgMult: 2 } });

        // Act
        const result = applyModifiers(outcome, fx, diff, []);

        // Assert
        expect(result.mn).toBe(-20);
      });

      it('dmgMult=1の場合はダメージが変化しない', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: -10 });
        const fx = createTestFx();
        const diff = createDomainTestDifficulty({ modifiers: { dmgMult: 1 } });

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
        const player = createDomainTestPlayer({ hp: 50, maxHp: 55 });

        // Act
        const result = applyChangesToPlayer(player, { hp: -10, mn: 0, inf: 0 }, null);

        // Assert
        expect(result.hp).toBe(40);
      });

      it('状態異常が追加される', () => {
        // Arrange
        const player = createDomainTestPlayer({ statuses: [] });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:負傷');

        // Assert
        expect(result.statuses).toContain('負傷');
      });

      it('状態異常が除去される', () => {
        // Arrange
        const player = createDomainTestPlayer({ statuses: ['負傷', '混乱'] });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'remove:負傷');

        // Assert
        expect(result.statuses).not.toContain('負傷');
        expect(result.statuses).toContain('混乱');
      });
    });

    describe('境界値', () => {
      it('HPが0未満にならない', () => {
        // Arrange
        const player = createDomainTestPlayer({ hp: 5, maxHp: 55 });

        // Act
        const result = applyChangesToPlayer(player, { hp: -100, mn: 0, inf: 0 }, null);

        // Assert
        expect(result.hp).toBe(0);
      });

      it('HPがmaxHpを超えない', () => {
        // Arrange
        const player = createDomainTestPlayer({ hp: 50, maxHp: 55 });

        // Act
        const result = applyChangesToPlayer(player, { hp: 100, mn: 0, inf: 0 }, null);

        // Assert
        expect(result.hp).toBe(55);
      });

      it('INFが0未満にならない', () => {
        // Arrange
        const player = createDomainTestPlayer({ inf: 3 });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: -100 }, null);

        // Assert
        expect(result.inf).toBe(0);
      });
    });

    describe('無効なフラグの型ガード', () => {
      it('無効なadd:フラグを渡した場合、ステータスが追加されない', () => {
        // Arrange
        const player = createDomainTestPlayer({ statuses: [] });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:unknown_status');

        // Assert: 無効なステータスIDはフィルタリングされる
        expect(result.statuses).toEqual([]);
      });

      it('有効なadd:フラグを渡した場合、ステータスが追加される', () => {
        // Arrange
        const player = createDomainTestPlayer({ statuses: [] });

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:負傷');

        // Assert
        expect(result.statuses).toContain('負傷');
      });

      it('無効なremove:フラグを渡した場合でもエラーにならない', () => {
        // Arrange
        const player = createDomainTestPlayer({ statuses: ['負傷'] });

        // Act & Assert: エラーが発生しないこと
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'remove:unknown_status');

        // 既存のステータスは維持される
        expect(result.statuses).toContain('負傷');
      });
    });

    describe('ステータスフラグプレフィックスの動作確認', () => {
      it('CFG.STATUS_FLAG_ADD_PREFIX（"add:"）でステータスが追加される', () => {
        // Arrange: プレフィックス定数経由でフラグを構築
        const player = createDomainTestPlayer({ statuses: [] });
        const addFlag = `${CFG.STATUS_FLAG_ADD_PREFIX}負傷`;

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, addFlag);

        // Assert
        expect(result.statuses).toContain('負傷');
      });

      it('CFG.STATUS_FLAG_REMOVE_PREFIX（"remove:"）でステータスが除去される', () => {
        // Arrange: プレフィックス定数経由でフラグを構築
        const player = createDomainTestPlayer({ statuses: ['負傷', '混乱'] });
        const removeFlag = `${CFG.STATUS_FLAG_REMOVE_PREFIX}負傷`;

        // Act
        const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, removeFlag);

        // Assert
        expect(result.statuses).not.toContain('負傷');
        expect(result.statuses).toContain('混乱');
      });
    });
  });

  describe('computeDrain', () => {
    describe('正常系', () => {
      it('ドレインなしの場合はdrainがnullになる', () => {
        // Arrange
        const player = createDomainTestPlayer({ statuses: [] });
        const fx = createTestFx({ drainImmune: true });

        // Act
        const result = computeDrain(player, fx, null);

        // Assert
        expect(result.drain).toBeNull();
      });

      it('出血ステータスでHPドレインが適用される', () => {
        // Arrange
        const player = createDomainTestPlayer({ hp: 50, maxHp: 55, statuses: ['出血'] });
        const fx = createTestFx();

        // Act
        const result = computeDrain(player, fx, null);

        // Assert
        expect(result.drain).not.toBeNull();
        expect(result.drain!.hp).toBe(-5);
      });

      it('bleedReduceで出血ダメージが半減する', () => {
        // Arrange
        const player = createDomainTestPlayer({ hp: 50, maxHp: 55, statuses: ['出血'] });
        const fx = createTestFx({ bleedReduce: true });

        // Act
        const result = computeDrain(player, fx, null);

        // Assert
        expect(result.drain!.hp).toBe(-2); // Math.round(-5 * 0.5) = -2
      });

      it('無効なステータスが含まれていてもクラッシュしない', () => {
        // Arrange: statusesに無効な値が含まれるプレイヤーを作成
        const player = createDomainTestPlayer({ hp: 50, maxHp: 55, statuses: [] });
        // 型安全を迂回して無効なステータスを注入
        const playerWithInvalid = {
          ...player,
          statuses: ['invalid_status', '出血'] as StatusEffectId[],
        };
        const fx = createTestFx();

        // Act: クラッシュせずに処理が完了すること
        const result = computeDrain(playerWithInvalid, fx, null);

        // Assert: 出血のドレインは正常に適用される
        expect(result.drain).not.toBeNull();
        expect(result.drain!.hp).toBe(-5);
      });

      it('drainImmuneで精神ドレインが無効化される', () => {
        // Arrange
        const player = createDomainTestPlayer({ statuses: [] });
        const fx = createTestFx({ drainImmune: true });
        const diff = createDomainTestDifficulty({ modifiers: { drainMod: -3 } });

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

    describe('CFG定数を使った境界値テスト', () => {
      it.each([
        [CFG.IMPACT_BIG_DMG_HP,     0,                     'dmg',    'hp === 閾値(-15)は bigDmg ではなく dmg'],
        [CFG.IMPACT_BIG_DMG_HP - 1, 0,                     'bigDmg', 'hp < 閾値(-16)は bigDmg'],
        [0,                          CFG.IMPACT_DMG_MN,     null,     'mn === 閾値(-10)は dmg ではなく null'],
        [0,                          CFG.IMPACT_DMG_MN - 1, 'dmg',    'mn < 閾値(-11)は dmg'],
      ] as const)('hp=%i, mn=%i → %s（%s）', (hp, mn, expected, _label) => {
        expect(classifyImpact(hp, mn)).toBe(expected);
      });
    });
  });

  describe('checkSecondLife', () => {
    it('HP=0でsecondLife有効かつ未使用の場合に復活する', () => {
      // Arrange
      const player = createDomainTestPlayer({ hp: 0, maxHp: 60, mn: 20, maxMn: 40 });
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
      const player = createDomainTestPlayer({ hp: 30, maxHp: 60, mn: 0, maxMn: 40 });
      const fx = createTestFx({ secondLife: true });

      // Act
      const result = checkSecondLife(player, fx, false);

      // Assert
      expect(result.activated).toBe(true);
      expect(result.player.mn).toBe(20); // maxMn / 2
    });

    it('secondLife未取得の場合は復活しない', () => {
      // Arrange
      const player = createDomainTestPlayer({ hp: 0, maxHp: 60 });
      const fx = createTestFx({ secondLife: false });

      // Act
      const result = checkSecondLife(player, fx, false);

      // Assert
      expect(result.activated).toBe(false);
    });

    it('使用済みの場合は復活しない', () => {
      // Arrange
      const player = createDomainTestPlayer({ hp: 0, maxHp: 60 });
      const fx = createTestFx({ secondLife: true });

      // Act
      const result = checkSecondLife(player, fx, true);

      // Assert
      expect(result.activated).toBe(false);
    });

    it('HP/MNが0でない場合は発動しない', () => {
      // Arrange
      const player = createDomainTestPlayer({ hp: 10, maxHp: 60, mn: 10, maxMn: 40 });
      const fx = createTestFx({ secondLife: true });

      // Act
      const result = checkSecondLife(player, fx, false);

      // Assert
      expect(result.activated).toBe(false);
    });
  });
});
