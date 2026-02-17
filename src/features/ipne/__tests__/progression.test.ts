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
});
