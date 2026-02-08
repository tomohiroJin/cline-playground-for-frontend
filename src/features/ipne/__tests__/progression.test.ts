/**
 * 成長システムのテスト
 */
import {
  KILL_COUNT_TABLE,
  LEVEL_UP_CHOICES,
  getKillCountForLevel,
  getLevelFromKillCount,
  shouldLevelUp,
  applyLevelUpChoice,
  canChooseStat,
  getNextKillsRequired,
} from '../progression';
import { PlayerStats, StatType } from '../types';

describe('progression', () => {
  describe('KILL_COUNT_TABLE', () => {
    test('各レベルの必要累計撃破数が正しいこと', () => {
      expect(KILL_COUNT_TABLE[2]).toBe(1);   // Lv1→2: 累計1
      expect(KILL_COUNT_TABLE[3]).toBe(3);   // Lv2→3: 累計3
      expect(KILL_COUNT_TABLE[4]).toBe(5);   // Lv3→4: 累計5
      expect(KILL_COUNT_TABLE[5]).toBe(7);   // Lv4→5: 累計7
      expect(KILL_COUNT_TABLE[6]).toBe(10);  // Lv5→6: 累計10
      expect(KILL_COUNT_TABLE[7]).toBe(13);  // Lv6→7: 累計13
      expect(KILL_COUNT_TABLE[8]).toBe(17);  // Lv7→8: 累計17
      expect(KILL_COUNT_TABLE[9]).toBe(21);  // Lv8→9: 累計21
      expect(KILL_COUNT_TABLE[10]).toBe(25); // Lv9→10: 累計25
    });
  });

  describe('getKillCountForLevel', () => {
    test('レベルに必要な累計撃破数を返すこと', () => {
      expect(getKillCountForLevel(1)).toBe(0);
      expect(getKillCountForLevel(2)).toBe(1);
      expect(getKillCountForLevel(10)).toBe(25);
    });
  });

  describe('getLevelFromKillCount', () => {
    test('撃破数からレベルが正しく計算されること', () => {
      expect(getLevelFromKillCount(0)).toBe(1);
      expect(getLevelFromKillCount(1)).toBe(2);
      expect(getLevelFromKillCount(2)).toBe(2);
      expect(getLevelFromKillCount(3)).toBe(3);
      expect(getLevelFromKillCount(25)).toBe(10);
    });

    test('境界値でのレベル判定が正しいこと', () => {
      expect(getLevelFromKillCount(4)).toBe(3);  // 累計5未満
      expect(getLevelFromKillCount(5)).toBe(4);  // 累計5でLv4
      expect(getLevelFromKillCount(24)).toBe(9); // 累計25未満
      expect(getLevelFromKillCount(25)).toBe(10);// 累計25でLv10
    });

    test('最大レベルを超えないこと', () => {
      expect(getLevelFromKillCount(100)).toBe(10);
    });
  });

  describe('shouldLevelUp', () => {
    test('撃破数が足りるとレベルアップ可能であること', () => {
      expect(shouldLevelUp(1, 1)).toBe(true);  // Lv1, 1体撃破 → Lv2へ
      expect(shouldLevelUp(2, 3)).toBe(true);  // Lv2, 3体撃破 → Lv3へ
    });

    test('撃破数が足りないとレベルアップ不可であること', () => {
      expect(shouldLevelUp(1, 0)).toBe(false); // Lv1, 0体撃破
      expect(shouldLevelUp(2, 2)).toBe(false); // Lv2, 2体撃破（3必要）
    });

    test('最大レベルではレベルアップ不可であること', () => {
      expect(shouldLevelUp(10, 100)).toBe(false);
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
      expect(getNextKillsRequired(2, 1)).toBe(2);  // Lv2, 1体 → あと2体（3-1）
      expect(getNextKillsRequired(2, 2)).toBe(1);  // Lv2, 2体 → あと1体
    });

    test('最大レベルでは0を返すこと', () => {
      expect(getNextKillsRequired(10, 25)).toBe(0);
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
});
