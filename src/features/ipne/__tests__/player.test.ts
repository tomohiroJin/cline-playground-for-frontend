import {
  movePlayer,
  createPlayer,
  updatePlayerDirection,
  damagePlayer,
  healPlayer,
  isPlayerInvincible,
  canPlayerAttack,
  setAttackCooldown,
} from '../player';
import { TileType, GameMap, Direction } from '../types';

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
});
