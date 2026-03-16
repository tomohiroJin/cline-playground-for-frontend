/**
 * エンティティに対する契約（DbC）の適用テスト
 *
 * 各エンティティの生成・操作時に事前条件・事後条件・不変条件が
 * 正しく検証されることをテストする。
 */
import { createPlayer, damagePlayer, processLevelUp } from '../entities/player';
import { createEnemy, damageEnemy } from '../entities/enemy';
import { PlayerClass, StatType } from '../types';

// テスト用モック
const mockIdGen = {
  generateEnemyId: () => 'e1',
  generateTrapId: () => 't1',
  generateItemId: () => 'i1',
  generateFeedbackId: () => 'f1',
};

describe('エンティティ契約テスト', () => {
  describe('Player 生成の事前条件', () => {
    it('正常な引数でプレイヤーを生成できる', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR);
      expect(player.hp).toBeGreaterThan(0);
      expect(player.maxHp).toBeGreaterThanOrEqual(player.hp);
      expect(player.level).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Player ダメージの事後条件', () => {
    it('ダメージ後のHPが0以上である', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR);
      const result = damagePlayer(player, 999, 0, 1000);
      expect(result.player.hp).toBeGreaterThanOrEqual(0);
    });

    it('ダメージ後のHPがmaxHPを超えない', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR);
      const result = damagePlayer(player, 1, 0, 1000);
      expect(result.player.hp).toBeLessThanOrEqual(result.player.maxHp);
    });
  });

  describe('Enemy 生成の事前条件', () => {
    it('正常な座標で敵を生成できる', () => {
      const enemy = createEnemy('patrol', 5, 3, mockIdGen);
      expect(enemy.x).toBe(5);
      expect(enemy.y).toBe(3);
      expect(enemy.hp).toBeGreaterThan(0);
    });

    it('負の座標ではエラーを投げる', () => {
      expect(() => createEnemy('patrol', -1, 0, mockIdGen))
        .toThrow('事前条件違反');
    });

    it('負のY座標ではエラーを投げる', () => {
      expect(() => createEnemy('patrol', 0, -1, mockIdGen))
        .toThrow('事前条件違反');
    });
  });

  describe('Enemy ダメージの不変条件', () => {
    it('ダメージ後のHPが0未満にならない', () => {
      const enemy = createEnemy('patrol', 1, 1, mockIdGen);
      const damaged = damageEnemy(enemy, 999);
      expect(damaged.hp).toBeGreaterThanOrEqual(0);
    });
  });

  describe('レベルアップの事前条件', () => {
    it('正常なステータスタイプでレベルアップできる', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR);
      const leveled = processLevelUp(player, StatType.ATTACK_POWER);
      expect(leveled.level).toBe(player.level + 1);
    });
  });
});
