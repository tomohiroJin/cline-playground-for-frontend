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
} from '../player';
import { TileType, GameMap, Direction, PlayerClass, StatType } from '../types';

describe('player', () => {
  describe('createPlayer', () => {
    test('初期位置でプレイヤーを作成できること', () => {
      const player = createPlayer(5, 3);
      expect(player.x).toBe(5);
      expect(player.y).toBe(3);
    });

    test('HPと向きの初期化が正しいこと', () => {
      const player = createPlayer(1, 1);
      expect(player.hp).toBe(16);
      expect(player.maxHp).toBe(16);
      expect(player.direction).toBe(Direction.DOWN);
      expect(player.isInvincible).toBe(false);
      expect(player.invincibleUntil).toBe(0);
      expect(player.attackCooldownUntil).toBe(0);
    });
  });

  describe('movePlayer', () => {
    // テスト用のシンプルなマップ
    const testMap: GameMap = [
      [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
    ];

    test('上方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.UP, testMap);
      expect(newPlayer.y).toBe(1);
      expect(newPlayer.x).toBe(2);
    });

    test('下方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.DOWN, testMap);
      expect(newPlayer.y).toBe(3);
      expect(newPlayer.x).toBe(2);
    });

    test('左方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.LEFT, testMap);
      expect(newPlayer.x).toBe(1);
      expect(newPlayer.y).toBe(2);
    });

    test('右方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.RIGHT, testMap);
      expect(newPlayer.x).toBe(3);
      expect(newPlayer.y).toBe(2);
    });

    test('壁に向かって移動できないこと', () => {
      const player = createPlayer(1, 1);
      // 上は壁
      const newPlayer = movePlayer(player, Direction.UP, testMap);
      expect(newPlayer.x).toBe(1);
      expect(newPlayer.y).toBe(1);
    });
  });

  describe('updatePlayerDirection', () => {
    test('指定した向きに更新されること', () => {
      const player = createPlayer(1, 1);
      const updated = updatePlayerDirection(player, Direction.LEFT);
      expect(updated.direction).toBe(Direction.LEFT);
    });
  });

  describe('damagePlayer', () => {
    test('ダメージでHPが減少すること', () => {
      const player = createPlayer(1, 1);
      const updated = damagePlayer(player, 3, 1000, 1000);
      expect(updated.hp).toBe(13);
    });

    test('HPが0未満にならないこと', () => {
      const player = createPlayer(1, 1);
      const updated = damagePlayer(player, 999, 1000, 1000);
      expect(updated.hp).toBe(0);
    });
  });

  describe('healPlayer', () => {
    test('回復でHPが増加すること', () => {
      const player = { ...createPlayer(1, 1), hp: 5 };
      const updated = healPlayer(player, 3);
      expect(updated.hp).toBe(8);
    });

    test('最大HPを超えないこと', () => {
      const player = { ...createPlayer(1, 1), hp: 15 };
      const updated = healPlayer(player, 5);
      expect(updated.hp).toBe(16);
    });
  });

  describe('isPlayerInvincible', () => {
    test('無敵時間中はtrueになること', () => {
      const player = { ...createPlayer(1, 1), isInvincible: true, invincibleUntil: 2000 };
      expect(isPlayerInvincible(player, 1500)).toBe(true);
    });

    test('無敵時間終了後はfalseになること', () => {
      const player = { ...createPlayer(1, 1), isInvincible: true, invincibleUntil: 2000 };
      expect(isPlayerInvincible(player, 2000)).toBe(false);
    });
  });

  describe('攻撃クールダウン', () => {
    test('クールダウン中は攻撃不可になること', () => {
      const player = { ...createPlayer(1, 1), attackCooldownUntil: 2000 };
      expect(canPlayerAttack(player, 1500)).toBe(false);
    });

    test('クールダウン終了後は攻撃可能になること', () => {
      const player = { ...createPlayer(1, 1), attackCooldownUntil: 2000 };
      expect(canPlayerAttack(player, 2000)).toBe(true);
    });

    test('攻撃後にクールダウンが設定されること', () => {
      const player = createPlayer(1, 1);
      const updated = setAttackCooldown(player, 1000, 500);
      expect(updated.attackCooldownUntil).toBe(1500);
    });
  });

  // ===== MVP3 テスト =====

  describe('職業別初期化', () => {
    test('戦士の初期能力値が正しいこと', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR);
      expect(player.playerClass).toBe(PlayerClass.WARRIOR);
      expect(player.stats.attackPower).toBe(2);
      expect(player.stats.attackRange).toBe(1);
      expect(player.stats.moveSpeed).toBe(4);
      expect(player.stats.attackSpeed).toBe(1.0);
      expect(player.stats.healBonus).toBe(0);
    });

    test('盗賊の初期能力値が正しいこと', () => {
      const player = createPlayer(1, 1, PlayerClass.THIEF);
      expect(player.playerClass).toBe(PlayerClass.THIEF);
      expect(player.stats.attackPower).toBe(1);
      expect(player.stats.attackRange).toBe(1);
      expect(player.stats.moveSpeed).toBe(6);
      expect(player.stats.attackSpeed).toBe(1.0);
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
      const player = createPlayer(1, 1);
      const result = incrementKillCount(player);
      expect(result.player.killCount).toBe(1);
    });

    test('レベルアップ条件で正しくフラグが立つこと', () => {
      const player = createPlayer(1, 1);
      const result = incrementKillCount(player);
      expect(result.shouldLevelUp).toBe(true); // 1体でLv2へ
    });

    test('レベルアップ条件を満たさない場合フラグが立たないこと', () => {
      const player = { ...createPlayer(1, 1), level: 2, killCount: 1 };
      const result = incrementKillCount(player);
      expect(result.player.killCount).toBe(2);
      expect(result.shouldLevelUp).toBe(false); // 2体ではLv3に届かない（3必要）
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
      expect(updated.stats.attackSpeed).toBeCloseTo(0.9);
      expect(updated.level).toBe(2);
    });

    test('回復量が正しく上昇すること', () => {
      const player = createPlayer(1, 1);
      const updated = processLevelUp(player, StatType.HEAL_BONUS);
      expect(updated.stats.healBonus).toBe(1);
      expect(updated.level).toBe(2);
    });
  });

  describe('getEffectiveAttackCooldown', () => {
    test('実効クールダウンが正しく計算されること', () => {
      const player = createPlayer(1, 1);
      const baseCooldown = 500;
      // attackSpeed 1.0 なら 500ms
      expect(getEffectiveAttackCooldown(player, baseCooldown)).toBe(500);
    });

    test('attackSpeedが低いほどクールダウンが短いこと', () => {
      const player = { ...createPlayer(1, 1), stats: { ...createPlayer(1, 1).stats, attackSpeed: 0.5 } };
      const baseCooldown = 500;
      // attackSpeed 0.5 なら 250ms
      expect(getEffectiveAttackCooldown(player, baseCooldown)).toBe(250);
    });
  });

  describe('getEffectiveHeal', () => {
    test('healBonusが回復に適用されること', () => {
      const player = { ...createPlayer(1, 1), stats: { ...createPlayer(1, 1).stats, healBonus: 2 } };
      expect(getEffectiveHeal(player, 3)).toBe(5); // 3 + 2
    });

    test('healBonusが0なら基本回復量のみ', () => {
      const player = createPlayer(1, 1);
      expect(getEffectiveHeal(player, 3)).toBe(3);
    });
  });

  describe('速度低下', () => {
    test('速度低下が正しく適用されること', () => {
      const player = createPlayer(1, 1);
      const updated = applySlowEffect(player, 1000, 3000);
      expect(updated.slowedUntil).toBe(4000);
    });

    test('速度低下状態を正しく判定できること', () => {
      const player = { ...createPlayer(1, 1), slowedUntil: 5000 };
      expect(isSlowed(player, 4000)).toBe(true);
      expect(isSlowed(player, 5000)).toBe(false);
      expect(isSlowed(player, 6000)).toBe(false);
    });

    test('実効速度が正しく計算されること', () => {
      const player = createPlayer(1, 1, PlayerClass.WARRIOR); // moveSpeed: 4
      // 通常時
      expect(getEffectiveMoveSpeed(player, 0)).toBe(4);
      // 速度低下時（50%低下）
      const slowedPlayer = { ...player, slowedUntil: 5000 };
      expect(getEffectiveMoveSpeed(slowedPlayer, 4000)).toBe(2);
    });
  });
});
