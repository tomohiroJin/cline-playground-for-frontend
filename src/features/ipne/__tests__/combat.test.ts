import { playerAttack, processEnemyContact, COMBAT_CONFIG, getAttackTarget, getAttackableWall } from '../combat';
import { createTestEnemy, createTestMap, createTestPlayer, createTestPlayerWithStats, createTestWall } from './testUtils';
import { Direction, EnemyType, WallType, WallState } from '../types';

describe('combat', () => {
  test('前方1タイルの敵にダメージを与えること', () => {
    const map = createTestMap();
    const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
    const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

    const result = playerAttack(player, [enemy], map, 1000);
    // 戦士の初期攻撃力は2
    expect(result.enemies[0].hp).toBe(enemy.hp - player.stats.attackPower);
  });

  test('範囲外の敵にはダメージが入らないこと', () => {
    const map = createTestMap();
    const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
    const enemy = createTestEnemy(EnemyType.PATROL, 4, 2);

    const result = playerAttack(player, [enemy], map, 1000);
    expect(result.enemies[0].hp).toBe(enemy.hp);
  });

  describe('攻撃力の反映', () => {
    test('attackPowerステータスに応じたダメージを与えること', () => {
      const map = createTestMap();
      // 攻撃力5のプレイヤーを作成
      const player = { ...createTestPlayerWithStats({ attackPower: 5 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

      const result = playerAttack(player, [enemy], map, 1000);
      // enemy.hp (3) - attackPower (5) = -2 → クランプで0
      expect(result.enemies[0].hp).toBe(Math.max(0, enemy.hp - 5));
    });

    test('攻撃力1でも正しくダメージを与えること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayerWithStats({ attackPower: 1 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

      const result = playerAttack(player, [enemy], map, 1000);
      expect(result.enemies[0].hp).toBe(enemy.hp - 1);
    });

    test('攻撃力に応じて敵を倒せること', () => {
      const map = createTestMap();
      // 敵のHP(4)と同じ攻撃力を持つプレイヤー
      const player = { ...createTestPlayerWithStats({ attackPower: 4 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

      const result = playerAttack(player, [enemy], map, 1000);
      expect(result.enemies[0].hp).toBe(0);
    });
  });

  describe('攻撃距離の反映', () => {
    test('attackRangeが2の場合、2マス先の敵を攻撃できること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayerWithStats({ attackRange: 2 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 4, 2);

      const target = getAttackTarget(player, [enemy], map);
      expect(target).toBeDefined();
      expect(target?.id).toBe(enemy.id);
    });

    test('attackRangeが1の場合、2マス先の敵を攻撃できないこと', () => {
      const map = createTestMap();
      const player = { ...createTestPlayerWithStats({ attackRange: 1 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 4, 2);

      const target = getAttackTarget(player, [enemy], map);
      expect(target).toBeUndefined();
    });

    test('攻撃距離内に壁がある場合、壁の向こうの敵は攻撃できないこと', () => {
      const map = createTestMap();
      // map[2][3]を壁にする
      map[2][3] = 1; // TileType.WALL
      const player = { ...createTestPlayerWithStats({ attackRange: 3 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 5, 2);

      const target = getAttackTarget(player, [enemy], map);
      expect(target).toBeUndefined();
    });

    test('攻撃距離内で最も近い敵を攻撃すること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayerWithStats({ attackRange: 3 }, 2, 2), direction: Direction.RIGHT };
      const nearEnemy = createTestEnemy(EnemyType.PATROL, 3, 2);
      const farEnemy = createTestEnemy(EnemyType.PATROL, 5, 2);

      const target = getAttackTarget(player, [nearEnemy, farEnemy], map);
      expect(target?.id).toBe(nearEnemy.id);
    });
  });

  describe('攻撃速度の反映', () => {
    test('attackSpeedが0.5の場合、クールダウンが半分になること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayerWithStats({ attackSpeed: 0.5 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

      const result = playerAttack(player, [enemy], map, 1000);
      // 攻撃速度0.5 → クールダウン 500 * 0.5 = 250ms
      expect(result.player.attackCooldownUntil).toBe(1000 + COMBAT_CONFIG.attackCooldown * 0.5);
    });

    test('attackSpeedが1.0の場合、標準のクールダウンになること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayerWithStats({ attackSpeed: 1.0 }, 2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

      const result = playerAttack(player, [enemy], map, 1000);
      expect(result.player.attackCooldownUntil).toBe(1000 + COMBAT_CONFIG.attackCooldown);
    });
  });

  test('クールダウン中は攻撃できないこと', () => {
    const map = createTestMap();
    const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
    const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

    const first = playerAttack(player, [enemy], map, 1000);
    const second = playerAttack(first.player, first.enemies, map, 1100);
    expect(second.didAttack).toBe(false);
  });

  test('接触時にダメージを受けること', () => {
    const player = createTestPlayer(2, 2);
    const enemy = createTestEnemy(EnemyType.PATROL, 2, 2);

    const result = processEnemyContact(player, [enemy], 1000);
    expect(result.player.hp).toBe(player.hp - enemy.damage);
  });

  test('無敵中は接触ダメージを受けないこと', () => {
    const player = {
      ...createTestPlayer(2, 2),
      isInvincible: true,
      invincibleUntil: 2000,
    };
    const enemy = createTestEnemy(EnemyType.PATROL, 2, 2);

    const result = processEnemyContact(player, [enemy], 1500);
    expect(result.player.hp).toBe(player.hp);
  });

  test('ノックバックで1タイル移動すること', () => {
    const map = createTestMap();
    const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
    const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

    const result = playerAttack(player, [enemy], map, 1000);
    const movedEnemy = result.enemies[0];
    expect(movedEnemy.x).toBe(4);
    expect(movedEnemy.y).toBe(2);
  });

  describe('破壊可能壁への攻撃', () => {
    test('敵がいない場合、破壊可能壁にダメージを与えること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const result = playerAttack(player, [], map, 1000, [wall]);
      expect(result.hitWall).toBe(true);
      expect(result.walls).toBeDefined();
      expect(result.walls![0].hp).toBe(3 - player.stats.attackPower);
    });

    test('敵がいる場合は、壁より敵を優先して攻撃すること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);
      const wall = createTestWall(WallType.BREAKABLE, 4, 2, WallState.INTACT, 3);

      const result = playerAttack(player, [enemy], map, 1000, [wall]);
      expect(result.hitWall).toBeUndefined();
      expect(result.enemies[0].hp).toBeLessThan(enemy.hp);
      expect(result.walls![0].hp).toBe(3); // 壁は無傷
    });

    test('壊れた壁には攻撃しないこと', () => {
      const map = createTestMap();
      const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.BROKEN, 0);

      const result = playerAttack(player, [], map, 1000, [wall]);
      expect(result.hitWall).toBeUndefined();
      expect(result.didAttack).toBe(true);
    });

    test('攻撃力が壁のHPを上回ると壁が壊れること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayerWithStats({ attackPower: 5 }, 2, 2), direction: Direction.RIGHT };
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const result = playerAttack(player, [], map, 1000, [wall]);
      expect(result.walls![0].hp).toBe(0);
      expect(result.walls![0].state).toBe(WallState.BROKEN);
    });

    test('getAttackableWallで破壊可能壁を取得できること', () => {
      const map = createTestMap();
      const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const target = getAttackableWall(player, [wall], map);
      expect(target).toBeDefined();
      expect(target?.x).toBe(3);
      expect(target?.y).toBe(2);
    });

    test('通常壁は攻撃対象にならないこと', () => {
      const map = createTestMap();
      const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
      const wall = createTestWall(WallType.NORMAL, 3, 2, WallState.INTACT);

      const target = getAttackableWall(player, [wall], map);
      expect(target).toBeUndefined();
    });
  });
});
