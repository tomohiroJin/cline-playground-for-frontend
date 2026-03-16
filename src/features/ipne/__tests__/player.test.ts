import {
  movePlayer,
  createPlayer,
  updatePlayerDirection,
  damagePlayer,
  healPlayer,
  isPlayerInvincible,
  canPlayerAttack,
  setAttackCooldown,
  incrementKillCount,
  processLevelUp,
  getEffectiveMoveSpeed,
  getEffectiveAttackCooldown,
  getEffectiveHeal,
  applySlowEffect,
  isSlowed,
} from '../domain/entities/player';
import { Direction, PlayerClass, StatType } from '../types';
import { aPlayer, aMap } from './builders';

describe('player', () => {
  describe('createPlayer', () => {
    test('初期位置でプレイヤーを作成できること', () => {
      const player = createPlayer(5, 3);
      expect(player.x).toBe(5);
      expect(player.y).toBe(3);
    });

    test('HPと向きの初期化が正しいこと（戦士）', () => {
      const player = createPlayer(1, 1);
      expect(player.hp).toBe(20);
      expect(player.maxHp).toBe(20);
      expect(player.direction).toBe(Direction.DOWN);
      expect(player.isInvincible).toBe(false);
      expect(player.invincibleUntil).toBe(0);
      expect(player.attackCooldownUntil).toBe(0);
    });
  });

  describe('movePlayer', () => {
    const testMap = aMap(5, 5).build();

    test('上方向に移動できること', () => {
      const player = aPlayer().at(2, 2).build();
      const newPlayer = movePlayer(player, Direction.UP, testMap);
      expect(newPlayer.y).toBe(1);
      expect(newPlayer.x).toBe(2);
    });

    test('下方向に移動できること', () => {
      const player = aPlayer().at(2, 2).build();
      const newPlayer = movePlayer(player, Direction.DOWN, testMap);
      expect(newPlayer.y).toBe(3);
      expect(newPlayer.x).toBe(2);
    });

    test('左方向に移動できること', () => {
      const player = aPlayer().at(2, 2).build();
      const newPlayer = movePlayer(player, Direction.LEFT, testMap);
      expect(newPlayer.x).toBe(1);
      expect(newPlayer.y).toBe(2);
    });

    test('右方向に移動できること', () => {
      const player = aPlayer().at(2, 2).build();
      const newPlayer = movePlayer(player, Direction.RIGHT, testMap);
      expect(newPlayer.x).toBe(3);
      expect(newPlayer.y).toBe(2);
    });

    test('壁に向かって移動できないこと', () => {
      const player = aPlayer().at(1, 1).build();
      const newPlayer = movePlayer(player, Direction.UP, testMap);
      expect(newPlayer.x).toBe(1);
      expect(newPlayer.y).toBe(1);
    });
  });

  describe('updatePlayerDirection', () => {
    test('指定した向きに更新されること', () => {
      const player = aPlayer().build();
      const updated = updatePlayerDirection(player, Direction.LEFT);
      expect(updated.direction).toBe(Direction.LEFT);
    });
  });

  describe('damagePlayer', () => {
    test('ダメージでHPが減少すること', () => {
      const player = aPlayer().build();
      const result = damagePlayer(player, 3, 1000, 1000);
      expect(result.player.hp).toBe(17);
      expect(result.tookDamage).toBe(true);
      expect(result.actualDamage).toBe(3);
    });

    test('HPが0未満にならないこと', () => {
      const player = aPlayer().build();
      const result = damagePlayer(player, 999, 1000, 1000);
      expect(result.player.hp).toBe(0);
      expect(result.tookDamage).toBe(true);
    });
  });

  describe('healPlayer', () => {
    test('回復でHPが増加すること', () => {
      const player = aPlayer().withHp(5).build();
      const updated = healPlayer(player, 3);
      expect(updated.hp).toBe(8);
    });

    test('最大HPを超えないこと', () => {
      const player = aPlayer().withHp(18).build();
      const updated = healPlayer(player, 5);
      expect(updated.hp).toBe(20);
    });
  });

  describe('isPlayerInvincible', () => {
    test('無敵時間中はtrueになること', () => {
      const player = aPlayer().invincibleUntil(2000).build();
      expect(isPlayerInvincible(player, 1500)).toBe(true);
    });

    test('無敵時間終了後はfalseになること', () => {
      const player = aPlayer().invincibleUntil(2000).build();
      expect(isPlayerInvincible(player, 2000)).toBe(false);
    });
  });

  describe('攻撃クールダウン', () => {
    test('クールダウン中は攻撃不可になること', () => {
      const player = aPlayer().withAttackCooldownUntil(2000).build();
      expect(canPlayerAttack(player, 1500)).toBe(false);
    });

    test('クールダウン終了後は攻撃可能になること', () => {
      const player = aPlayer().withAttackCooldownUntil(2000).build();
      expect(canPlayerAttack(player, 2000)).toBe(true);
    });

    test('攻撃後にクールダウンが設定されること', () => {
      const player = aPlayer().build();
      const updated = setAttackCooldown(player, 1000, 500);
      expect(updated.attackCooldownUntil).toBe(1500);
    });
  });

  // ===== MVP3 テスト =====

  describe('職業別初期化', () => {
    test('戦士の初期能力値が正しいこと', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR);
      expect(player.playerClass).toBe(PlayerClass.WARRIOR);
      expect(player.hp).toBe(20);
      expect(player.maxHp).toBe(20);
      expect(player.stats.attackPower).toBe(2);
      expect(player.stats.attackRange).toBe(1);
      expect(player.stats.moveSpeed).toBe(4);
      expect(player.stats.attackSpeed).toBeCloseTo(0.7);
      expect(player.stats.healBonus).toBe(1);
    });

    test('盗賊の初期能力値が正しいこと', () => {
      const player = createPlayer(1, 1, PlayerClass.THIEF);
      expect(player.playerClass).toBe(PlayerClass.THIEF);
      expect(player.hp).toBe(12);
      expect(player.maxHp).toBe(12);
      expect(player.stats.attackPower).toBe(1);
      expect(player.stats.attackRange).toBe(1);
      expect(player.stats.moveSpeed).toBe(6);
      expect(player.stats.attackSpeed).toBeCloseTo(1.0);
      expect(player.stats.healBonus).toBe(0);
    });

    test('レベルと撃破数が正しく初期化されること', () => {
      const player = createPlayer(1, 1);
      expect(player.level).toBe(1);
      expect(player.killCount).toBe(0);
      expect(player.slowedUntil).toBe(0);
    });
  });

  describe('incrementKillCount', () => {
    test('撃破数が正しく加算されること', () => {
      const player = aPlayer().build();
      const result = incrementKillCount(player);
      expect(result.player.killCount).toBe(1);
    });

    test('レベルアップ条件で正しくフラグが立つこと', () => {
      const player = aPlayer().build();
      const result = incrementKillCount(player);
      expect(result.shouldLevelUp).toBe(true);
    });

    test('レベルアップ条件を満たさない場合フラグが立たないこと', () => {
      const player = aPlayer().withLevel(3).withKillCount(2).build();
      const result = incrementKillCount(player);
      expect(result.player.killCount).toBe(3);
      expect(result.shouldLevelUp).toBe(false);
    });
  });

  describe('processLevelUp', () => {
    test('攻撃力が正しく上昇すること', () => {
      const player = createPlayer(1, 1);
      const updated = processLevelUp(player, StatType.ATTACK_POWER);
      expect(updated.stats.attackPower).toBe(3);
      expect(updated.level).toBe(2);
    });

    test('攻撃速度が正しく減少すること（クールダウン短縮）', () => {
      const player = createPlayer(1, 1);
      const updated = processLevelUp(player, StatType.ATTACK_SPEED);
      expect(updated.stats.attackSpeed).toBeCloseTo(0.6);
      expect(updated.level).toBe(2);
    });

    test('回復量が正しく上昇すること', () => {
      const player = createPlayer(1, 1);
      const updated = processLevelUp(player, StatType.HEAL_BONUS);
      expect(updated.stats.healBonus).toBe(2);
      expect(updated.level).toBe(2);
    });
  });

  describe('getEffectiveAttackCooldown', () => {
    test('実効クールダウンが正しく計算されること（戦士）', () => {
      const player = createPlayer(1, 1);
      expect(getEffectiveAttackCooldown(player, 500)).toBe(350);
    });

    test('実効クールダウンが正しく計算されること（盗賊）', () => {
      const player = createPlayer(1, 1, PlayerClass.THIEF);
      expect(getEffectiveAttackCooldown(player, 500)).toBe(500);
    });

    test('attackSpeedが低いほどクールダウンが短いこと', () => {
      const player = aPlayer().withStats({ attackSpeed: 0.5 }).build();
      expect(getEffectiveAttackCooldown(player, 500)).toBe(250);
    });
  });

  describe('getEffectiveHeal', () => {
    test('healBonusが回復に適用されること（戦士）', () => {
      const player = createPlayer(1, 1);
      expect(getEffectiveHeal(player, 3)).toBe(4);
    });

    test('healBonusが0なら基本回復量のみ（盗賊）', () => {
      const player = createPlayer(1, 1, PlayerClass.THIEF);
      expect(getEffectiveHeal(player, 3)).toBe(3);
    });

    test('カスタムhealBonusが適用されること', () => {
      const player = aPlayer().withStats({ healBonus: 2 }).build();
      expect(getEffectiveHeal(player, 3)).toBe(5);
    });
  });

  describe('速度低下', () => {
    test('速度低下が正しく適用されること', () => {
      const player = aPlayer().build();
      const updated = applySlowEffect(player, 1000, 3000);
      expect(updated.slowedUntil).toBe(4000);
    });

    test('速度低下状態を正しく判定できること', () => {
      const player = aPlayer().slowedUntil(5000).build();
      expect(isSlowed(player, 4000)).toBe(true);
      expect(isSlowed(player, 5000)).toBe(false);
      expect(isSlowed(player, 6000)).toBe(false);
    });

    test('実効速度が正しく計算されること', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR);
      // 通常時
      expect(getEffectiveMoveSpeed(player, 0)).toBe(4);
      // 速度低下時（50%低下）
      const slowedPlayer = aPlayer().withStats({ moveSpeed: 4 }).slowedUntil(5000).build();
      expect(getEffectiveMoveSpeed(slowedPlayer, 4000)).toBe(2);
    });
  });
});
