/**
 * 成長システムのテスト
 */
import {
  KILL_COUNT_TABLE,
  LEVEL_UP_CHOICES,
  MAX_LEVEL,
  STAT_LIMITS,
  getKillCountForLevel,
  getLevelFromKillCount,
  shouldLevelUp,
  applyLevelUpChoice,
  canChooseStat,
  getNextKillsRequired,
  applyStageReward,
  canChooseReward,
  shouldLevelUpInStage,
} from '../domain/services/progressionService';
import { PlayerStats, StatType } from '../types';
import { aPlayer } from './builders';

describe('progression', () => {
  describe('KILL_COUNT_TABLE', () => {
    test('各レベルの必要累計撃破数が正しいこと', () => {
      // ステージ1（maxLevel=10）
      expect(KILL_COUNT_TABLE[1]).toBe(0);     // 初期状態
      expect(KILL_COUNT_TABLE[2]).toBe(1);     // 1体撃破でLv2
      expect(KILL_COUNT_TABLE[3]).toBe(2);     // 2体撃破でLv3
      expect(KILL_COUNT_TABLE[4]).toBe(4);     // 4体撃破でLv4
      expect(KILL_COUNT_TABLE[5]).toBe(6);     // 6体撃破でLv5
      expect(KILL_COUNT_TABLE[6]).toBe(8);     // 8体撃破でLv6
      expect(KILL_COUNT_TABLE[7]).toBe(10);    // 10体撃破でLv7
      expect(KILL_COUNT_TABLE[8]).toBe(13);    // 13体撃破でLv8
      expect(KILL_COUNT_TABLE[9]).toBe(16);    // 16体撃破でLv9
      expect(KILL_COUNT_TABLE[10]).toBe(20);   // 20体撃破でLv10
      // ステージ2（maxLevel=13）
      expect(KILL_COUNT_TABLE[11]).toBe(25);   // 累計25体でLv11
      expect(KILL_COUNT_TABLE[12]).toBe(31);   // 累計31体でLv12
      expect(KILL_COUNT_TABLE[13]).toBe(38);   // 累計38体でLv13
      // ステージ3（maxLevel=16）
      expect(KILL_COUNT_TABLE[14]).toBe(46);   // 累計46体でLv14
      expect(KILL_COUNT_TABLE[15]).toBe(55);   // 累計55体でLv15
      expect(KILL_COUNT_TABLE[16]).toBe(65);   // 累計65体でLv16
      // ステージ4（maxLevel=19）
      expect(KILL_COUNT_TABLE[17]).toBe(76);   // 累計76体でLv17
      expect(KILL_COUNT_TABLE[18]).toBe(88);   // 累計88体でLv18
      expect(KILL_COUNT_TABLE[19]).toBe(101);  // 累計101体でLv19
      // ステージ5（maxLevel=22）
      expect(KILL_COUNT_TABLE[20]).toBe(116);  // 累計116体でLv20
      expect(KILL_COUNT_TABLE[21]).toBe(132);  // 累計132体でLv21
      expect(KILL_COUNT_TABLE[22]).toBe(150);  // 累計150体でLv22
    });
  });

  describe('getKillCountForLevel', () => {
    test('レベルに必要な累計撃破数を返すこと', () => {
      expect(getKillCountForLevel(1)).toBe(0);
      expect(getKillCountForLevel(2)).toBe(1);
      expect(getKillCountForLevel(10)).toBe(20);
    });
  });

  describe('getLevelFromKillCount', () => {
    test('撃破数からレベルが正しく計算されること', () => {
      expect(getLevelFromKillCount(0)).toBe(1);
      expect(getLevelFromKillCount(1)).toBe(2);
      expect(getLevelFromKillCount(4)).toBe(4);
      expect(getLevelFromKillCount(20)).toBe(10);
      expect(getLevelFromKillCount(38)).toBe(13);
    });

    test('境界値でのレベル判定が正しいこと', () => {
      expect(getLevelFromKillCount(19)).toBe(9);   // 累計20未満
      expect(getLevelFromKillCount(20)).toBe(10);  // 累計20でLv10
      expect(getLevelFromKillCount(24)).toBe(10);  // 累計25未満
      expect(getLevelFromKillCount(25)).toBe(11);  // 累計25でLv11
    });

    test('最大レベルを超えないこと', () => {
      expect(getLevelFromKillCount(300)).toBe(22);
    });
  });

  describe('shouldLevelUp', () => {
    test('撃破数が足りるとレベルアップ可能であること', () => {
      expect(shouldLevelUp(1, 1)).toBe(true);  // Lv1, 1体撃破 → Lv2へ
      expect(shouldLevelUp(2, 2)).toBe(true);  // Lv2, 2体撃破 → Lv3へ
    });

    test('撃破数が足りないとレベルアップ不可であること', () => {
      expect(shouldLevelUp(1, 0)).toBe(false); // Lv1, 0体撃破
      expect(shouldLevelUp(3, 3)).toBe(false); // Lv3, 3体撃破（4必要）
    });

    test('最大レベルではレベルアップ不可であること', () => {
      expect(shouldLevelUp(22, 300)).toBe(false);
    });
  });

  describe('applyLevelUpChoice', () => {
    const baseStats: PlayerStats = {
      attackPower: 2,
      attackRange: 1,
      moveSpeed: 4,
      attackSpeed: 1.0,
      healBonus: 0,
    };

    test('攻撃力上昇が正しいこと（+1）', () => {
      const result = applyLevelUpChoice(baseStats, StatType.ATTACK_POWER);
      expect(result.attackPower).toBe(3);
    });

    test('攻撃距離上昇が正しいこと（+1）', () => {
      const result = applyLevelUpChoice(baseStats, StatType.ATTACK_RANGE);
      expect(result.attackRange).toBe(2);
    });

    test('移動速度上昇が正しいこと（+1）', () => {
      const result = applyLevelUpChoice(baseStats, StatType.MOVE_SPEED);
      expect(result.moveSpeed).toBe(5);
    });

    test('攻撃速度上昇が正しいこと（-0.1）', () => {
      const result = applyLevelUpChoice(baseStats, StatType.ATTACK_SPEED);
      expect(result.attackSpeed).toBeCloseTo(0.9);
    });

    test('回復量上昇が正しいこと（+1）', () => {
      const result = applyLevelUpChoice(baseStats, StatType.HEAL_BONUS);
      expect(result.healBonus).toBe(1);
    });
  });

  describe('canChooseStat', () => {
    test('上限未達の能力は選択可能であること', () => {
      const stats: PlayerStats = {
        attackPower: 5,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: 0,
      };
      expect(canChooseStat(stats, StatType.ATTACK_POWER)).toBe(true);
      expect(canChooseStat(stats, StatType.ATTACK_RANGE)).toBe(true);
      expect(canChooseStat(stats, StatType.MOVE_SPEED)).toBe(true);
      expect(canChooseStat(stats, StatType.ATTACK_SPEED)).toBe(true);
      expect(canChooseStat(stats, StatType.HEAL_BONUS)).toBe(true);
    });

    test('攻撃距離が上限（3）に達すると選択不可であること', () => {
      const stats: PlayerStats = {
        attackPower: 5,
        attackRange: 3,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: 0,
      };
      expect(canChooseStat(stats, StatType.ATTACK_RANGE)).toBe(false);
    });

    test('移動速度が上限（8）に達すると選択不可であること', () => {
      const stats: PlayerStats = {
        attackPower: 5,
        attackRange: 1,
        moveSpeed: 8,
        attackSpeed: 1.0,
        healBonus: 0,
      };
      expect(canChooseStat(stats, StatType.MOVE_SPEED)).toBe(false);
    });

    test('攻撃速度が上限（0.5）に達すると選択不可であること', () => {
      const stats: PlayerStats = {
        attackPower: 5,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: 0.5,
        healBonus: 0,
      };
      expect(canChooseStat(stats, StatType.ATTACK_SPEED)).toBe(false);
    });

    test('回復量が上限（5）に達すると選択不可であること', () => {
      const stats: PlayerStats = {
        attackPower: 5,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: 5,
      };
      expect(canChooseStat(stats, StatType.HEAL_BONUS)).toBe(false);
    });

    test('攻撃力は上限なしで常に選択可能であること', () => {
      const stats: PlayerStats = {
        attackPower: 100,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: 0,
      };
      expect(canChooseStat(stats, StatType.ATTACK_POWER)).toBe(true);
    });
  });

  describe('getNextKillsRequired', () => {
    test('次レベルまでの必要撃破数を返すこと', () => {
      expect(getNextKillsRequired(1, 0)).toBe(1);  // Lv1, 0体 → あと1体
      expect(getNextKillsRequired(3, 3)).toBe(1);  // Lv3, 3体 → あと1体（4-3）
      expect(getNextKillsRequired(10, 22)).toBe(3); // Lv10, 22体 → あと3体（25-22）
    });

    test('最大レベルでは0を返すこと', () => {
      expect(getNextKillsRequired(22, 150)).toBe(0);
    });
  });

  describe('LEVEL_UP_CHOICES', () => {
    test('5つの選択肢が定義されていること', () => {
      expect(LEVEL_UP_CHOICES.length).toBe(5);
    });

    test('各選択肢に正しい能力が設定されていること', () => {
      const stats = LEVEL_UP_CHOICES.map(c => c.stat);
      expect(stats).toContain(StatType.ATTACK_POWER);
      expect(stats).toContain(StatType.ATTACK_RANGE);
      expect(stats).toContain(StatType.MOVE_SPEED);
      expect(stats).toContain(StatType.ATTACK_SPEED);
      expect(stats).toContain(StatType.HEAL_BONUS);
    });
  });

  // ===== 追加テスト =====

  describe('getKillCountForLevel（エッジケース）', () => {
    test('レベル0以下の場合は0を返すこと', () => {
      expect(getKillCountForLevel(0)).toBe(0);
      expect(getKillCountForLevel(-1)).toBe(0);
    });

    test('MAX_LEVELを超えるレベルの場合はMAX_LEVELの値を返すこと', () => {
      const maxLevelKills = KILL_COUNT_TABLE[MAX_LEVEL];
      expect(getKillCountForLevel(MAX_LEVEL + 1)).toBe(maxLevelKills);
      expect(getKillCountForLevel(100)).toBe(maxLevelKills);
    });

    test('MAX_LEVELの場合は正しい値を返すこと', () => {
      expect(getKillCountForLevel(MAX_LEVEL)).toBe(KILL_COUNT_TABLE[MAX_LEVEL]);
    });
  });

  describe('getLevelFromKillCount（エッジケース）', () => {
    test('負の撃破数ではレベル1を返すこと', () => {
      expect(getLevelFromKillCount(-1)).toBe(1);
      expect(getLevelFromKillCount(-100)).toBe(1);
    });
  });

  describe('applyLevelUpChoice（上限テスト）', () => {
    test('攻撃距離が上限に達している場合、上限を超えないこと', () => {
      // Arrange
      const stats: PlayerStats = {
        attackPower: 2,
        attackRange: STAT_LIMITS[StatType.ATTACK_RANGE]!,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: 0,
      };

      // Act
      const result = applyLevelUpChoice(stats, StatType.ATTACK_RANGE);

      // Assert
      expect(result.attackRange).toBe(STAT_LIMITS[StatType.ATTACK_RANGE]);
    });

    test('移動速度が上限に達している場合、上限を超えないこと', () => {
      const stats: PlayerStats = {
        attackPower: 2,
        attackRange: 1,
        moveSpeed: STAT_LIMITS[StatType.MOVE_SPEED]!,
        attackSpeed: 1.0,
        healBonus: 0,
      };

      const result = applyLevelUpChoice(stats, StatType.MOVE_SPEED);

      expect(result.moveSpeed).toBe(STAT_LIMITS[StatType.MOVE_SPEED]);
    });

    test('攻撃速度が上限に達している場合、上限を超えないこと', () => {
      const stats: PlayerStats = {
        attackPower: 2,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: STAT_LIMITS[StatType.ATTACK_SPEED]!,
        healBonus: 0,
      };

      const result = applyLevelUpChoice(stats, StatType.ATTACK_SPEED);

      expect(result.attackSpeed).toBe(STAT_LIMITS[StatType.ATTACK_SPEED]);
    });

    test('回復量が上限に達している場合、上限を超えないこと', () => {
      const stats: PlayerStats = {
        attackPower: 2,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: STAT_LIMITS[StatType.HEAL_BONUS]!,
      };

      const result = applyLevelUpChoice(stats, StatType.HEAL_BONUS);

      expect(result.healBonus).toBe(STAT_LIMITS[StatType.HEAL_BONUS]);
    });

    test('存在しない能力タイプの場合、ステータスが変化しないこと', () => {
      const stats: PlayerStats = {
        attackPower: 2,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: 0,
      };

      // 存在しない型をキャストして渡す
      const result = applyLevelUpChoice(stats, 'unknown_stat' as unknown as typeof StatType.ATTACK_POWER);

      expect(result).toEqual(stats);
    });

    test('元のステータスオブジェクトが変更されないこと（不変性）', () => {
      const stats: PlayerStats = {
        attackPower: 2,
        attackRange: 1,
        moveSpeed: 4,
        attackSpeed: 1.0,
        healBonus: 0,
      };

      const result = applyLevelUpChoice(stats, StatType.ATTACK_POWER);

      // 元のオブジェクトが変更されていないことを確認
      expect(stats.attackPower).toBe(2);
      expect(result.attackPower).toBe(3);
      expect(result).not.toBe(stats);
    });
  });

  describe('getNextKillsRequired（エッジケース）', () => {
    test('撃破数が次レベル要件を超えている場合は0を返すこと', () => {
      // Lv1で撃破数10（Lv2には1体必要）
      expect(getNextKillsRequired(1, 10)).toBe(0);
    });
  });

  describe('applyStageReward', () => {
    test('max_hp報酬でmaxHpとhpが+5されること', () => {
      // Arrange
      const player = aPlayer().withHp(15, 20).build();

      // Act
      const result = applyStageReward(player, 'max_hp');

      // Assert
      expect(result.maxHp).toBe(25);
      expect(result.hp).toBe(20);
    });

    test('attack_power報酬で攻撃力が+1されること', () => {
      const player = aPlayer().withStats({ attackPower: 3 }).build();

      const result = applyStageReward(player, 'attack_power');

      expect(result.stats.attackPower).toBe(4);
    });

    test('attack_range報酬で攻撃距離が+1されること', () => {
      const player = aPlayer().withStats({ attackRange: 1 }).build();

      const result = applyStageReward(player, 'attack_range');

      expect(result.stats.attackRange).toBe(2);
    });

    test('attack_range報酬が上限を超えないこと', () => {
      const player = aPlayer().withStats({ attackRange: STAT_LIMITS[StatType.ATTACK_RANGE]! }).build();

      const result = applyStageReward(player, 'attack_range');

      expect(result.stats.attackRange).toBe(STAT_LIMITS[StatType.ATTACK_RANGE]);
    });

    test('move_speed報酬で移動速度が+1されること', () => {
      const player = aPlayer().withStats({ moveSpeed: 4 }).build();

      const result = applyStageReward(player, 'move_speed');

      expect(result.stats.moveSpeed).toBe(5);
    });

    test('move_speed報酬が上限を超えないこと', () => {
      const player = aPlayer().withStats({ moveSpeed: STAT_LIMITS[StatType.MOVE_SPEED]! }).build();

      const result = applyStageReward(player, 'move_speed');

      expect(result.stats.moveSpeed).toBe(STAT_LIMITS[StatType.MOVE_SPEED]);
    });

    test('attack_speed報酬で攻撃速度が-0.1されること', () => {
      const player = aPlayer().withStats({ attackSpeed: 1.0 }).build();

      const result = applyStageReward(player, 'attack_speed');

      expect(result.stats.attackSpeed).toBeCloseTo(0.9);
    });

    test('attack_speed報酬が上限を超えないこと', () => {
      const player = aPlayer().withStats({ attackSpeed: STAT_LIMITS[StatType.ATTACK_SPEED]! }).build();

      const result = applyStageReward(player, 'attack_speed');

      expect(result.stats.attackSpeed).toBe(STAT_LIMITS[StatType.ATTACK_SPEED]);
    });

    test('heal_bonus報酬で回復量が+1されること', () => {
      const player = aPlayer().withStats({ healBonus: 2 }).build();

      const result = applyStageReward(player, 'heal_bonus');

      expect(result.stats.healBonus).toBe(3);
    });

    test('heal_bonus報酬が上限を超えないこと', () => {
      const player = aPlayer().withStats({ healBonus: STAT_LIMITS[StatType.HEAL_BONUS]! }).build();

      const result = applyStageReward(player, 'heal_bonus');

      expect(result.stats.healBonus).toBe(STAT_LIMITS[StatType.HEAL_BONUS]);
    });

    test('元のプレイヤーオブジェクトが変更されないこと（不変性）', () => {
      const player = aPlayer().withHp(20, 20).withStats({ attackPower: 3 }).build();

      const result = applyStageReward(player, 'attack_power');

      expect(player.stats.attackPower).toBe(3);
      expect(result.stats.attackPower).toBe(4);
      expect(result).not.toBe(player);
      expect(result.stats).not.toBe(player.stats);
    });
  });

  describe('canChooseReward', () => {
    test('max_hp報酬は常に選択可能であること', () => {
      const player = aPlayer().build();

      expect(canChooseReward(player, 'max_hp')).toBe(true);
    });

    test('attack_power報酬は常に選択可能であること', () => {
      const player = aPlayer().withStats({ attackPower: 100 }).build();

      expect(canChooseReward(player, 'attack_power')).toBe(true);
    });

    test('attack_range報酬が上限未満なら選択可能であること', () => {
      const player = aPlayer().withStats({ attackRange: 1 }).build();

      expect(canChooseReward(player, 'attack_range')).toBe(true);
    });

    test('attack_range報酬が上限に達すると選択不可であること', () => {
      const player = aPlayer().withStats({ attackRange: STAT_LIMITS[StatType.ATTACK_RANGE]! }).build();

      expect(canChooseReward(player, 'attack_range')).toBe(false);
    });

    test('move_speed報酬が上限に達すると選択不可であること', () => {
      const player = aPlayer().withStats({ moveSpeed: STAT_LIMITS[StatType.MOVE_SPEED]! }).build();

      expect(canChooseReward(player, 'move_speed')).toBe(false);
    });

    test('attack_speed報酬が上限に達すると選択不可であること', () => {
      const player = aPlayer().withStats({ attackSpeed: STAT_LIMITS[StatType.ATTACK_SPEED]! }).build();

      expect(canChooseReward(player, 'attack_speed')).toBe(false);
    });

    test('heal_bonus報酬が上限に達すると選択不可であること', () => {
      const player = aPlayer().withStats({ healBonus: STAT_LIMITS[StatType.HEAL_BONUS]! }).build();

      expect(canChooseReward(player, 'heal_bonus')).toBe(false);
    });
  });

  describe('shouldLevelUpInStage', () => {
    test('ステージレベル上限未満で撃破数が足りればレベルアップ可能であること', () => {
      // Lv1、撃破数1、ステージ上限10 → Lv2へレベルアップ可能
      expect(shouldLevelUpInStage(1, 1, 10)).toBe(true);
    });

    test('ステージレベル上限に達するとレベルアップ不可であること', () => {
      // Lv10、撃破数100、ステージ上限10 → レベルアップ不可
      expect(shouldLevelUpInStage(10, 100, 10)).toBe(false);
    });

    test('グローバルMAX_LEVELに達するとレベルアップ不可であること', () => {
      // MAX_LEVEL到達、ステージ上限がそれ以上でも不可
      expect(shouldLevelUpInStage(MAX_LEVEL, 999, MAX_LEVEL + 5)).toBe(false);
    });

    test('撃破数が足りない場合はレベルアップ不可であること', () => {
      // Lv3、撃破数3（Lv4には4必要）、ステージ上限10
      expect(shouldLevelUpInStage(3, 3, 10)).toBe(false);
    });

    test('ステージ上限がグローバル上限より低い場合に正しく制限されること', () => {
      // Lv9、撃破数20、ステージ上限10 → Lv10へ可能
      expect(shouldLevelUpInStage(9, 20, 10)).toBe(true);
      // Lv10、撃破数25、ステージ上限10 → Lv11へ不可
      expect(shouldLevelUpInStage(10, 25, 10)).toBe(false);
    });
  });

  describe('STAT_LIMITS', () => {
    test('各能力値の上限が定義されていること', () => {
      expect(STAT_LIMITS[StatType.ATTACK_RANGE]).toBeDefined();
      expect(STAT_LIMITS[StatType.MOVE_SPEED]).toBeDefined();
      expect(STAT_LIMITS[StatType.ATTACK_SPEED]).toBeDefined();
      expect(STAT_LIMITS[StatType.HEAL_BONUS]).toBeDefined();
    });

    test('ATTACK_POWERには上限が定義されていないこと', () => {
      expect(STAT_LIMITS[StatType.ATTACK_POWER]).toBeUndefined();
    });
  });
});
