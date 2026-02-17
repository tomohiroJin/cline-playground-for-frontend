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
      // ステージ1（maxLevel=3）
      expect(KILL_COUNT_TABLE[1]).toBe(0);     // 初期状態
      expect(KILL_COUNT_TABLE[2]).toBe(3);     // 3体撃破でLv2
      expect(KILL_COUNT_TABLE[3]).toBe(7);     // 7体撃破でLv3
      // ステージ2（maxLevel=6）
      expect(KILL_COUNT_TABLE[4]).toBe(12);    // 累計12体でLv4
      expect(KILL_COUNT_TABLE[5]).toBe(18);    // 累計18体でLv5
      expect(KILL_COUNT_TABLE[6]).toBe(25);    // 累計25体でLv6
      // ステージ3（maxLevel=9）
      expect(KILL_COUNT_TABLE[7]).toBe(33);    // 累計33体でLv7
      expect(KILL_COUNT_TABLE[8]).toBe(42);    // 累計42体でLv8
      expect(KILL_COUNT_TABLE[9]).toBe(52);    // 累計52体でLv9
      // ステージ4（maxLevel=12）
      expect(KILL_COUNT_TABLE[10]).toBe(63);   // 累計63体でLv10
      expect(KILL_COUNT_TABLE[11]).toBe(75);   // 累計75体でLv11
      expect(KILL_COUNT_TABLE[12]).toBe(88);   // 累計88体でLv12
      // ステージ5（maxLevel=15）
      expect(KILL_COUNT_TABLE[13]).toBe(102);  // 累計102体でLv13
      expect(KILL_COUNT_TABLE[14]).toBe(118);  // 累計118体でLv14
      expect(KILL_COUNT_TABLE[15]).toBe(135);  // 累計135体でLv15
    });
  });

  describe('getKillCountForLevel', () => {
    test('レベルに必要な累計撃破数を返すこと', () => {
      expect(getKillCountForLevel(1)).toBe(0);
      expect(getKillCountForLevel(2)).toBe(3);
      expect(getKillCountForLevel(10)).toBe(63);
    });
  });

  describe('getLevelFromKillCount', () => {
    test('撃破数からレベルが正しく計算されること', () => {
      expect(getLevelFromKillCount(0)).toBe(1);
      expect(getLevelFromKillCount(3)).toBe(2);
      expect(getLevelFromKillCount(6)).toBe(2);
      expect(getLevelFromKillCount(7)).toBe(3);
      expect(getLevelFromKillCount(63)).toBe(10);
    });

    test('境界値でのレベル判定が正しいこと', () => {
      expect(getLevelFromKillCount(11)).toBe(3);  // 累計12未満
      expect(getLevelFromKillCount(12)).toBe(4);  // 累計12でLv4
      expect(getLevelFromKillCount(62)).toBe(9);  // 累計63未満
      expect(getLevelFromKillCount(63)).toBe(10); // 累計63でLv10
    });

    test('最大レベルを超えないこと', () => {
      expect(getLevelFromKillCount(200)).toBe(15);
    });
  });

  describe('shouldLevelUp', () => {
    test('撃破数が足りるとレベルアップ可能であること', () => {
      expect(shouldLevelUp(1, 3)).toBe(true);  // Lv1, 3体撃破 → Lv2へ
      expect(shouldLevelUp(2, 7)).toBe(true);  // Lv2, 7体撃破 → Lv3へ
    });

    test('撃破数が足りないとレベルアップ不可であること', () => {
      expect(shouldLevelUp(1, 0)).toBe(false); // Lv1, 0体撃破
      expect(shouldLevelUp(1, 2)).toBe(false); // Lv1, 2体撃破（3必要）
    });

    test('最大レベルではレベルアップ不可であること', () => {
      expect(shouldLevelUp(15, 200)).toBe(false);
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
      expect(getNextKillsRequired(1, 0)).toBe(3);  // Lv1, 0体 → あと3体
      expect(getNextKillsRequired(1, 2)).toBe(1);  // Lv1, 2体 → あと1体
      expect(getNextKillsRequired(2, 5)).toBe(2);  // Lv2, 5体 → あと2体（7-5）
    });

    test('最大レベルでは0を返すこと', () => {
      expect(getNextKillsRequired(15, 135)).toBe(0);
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
