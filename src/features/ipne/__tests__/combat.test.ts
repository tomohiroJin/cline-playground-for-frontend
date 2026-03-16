import { playerAttack, processEnemyContact, COMBAT_CONFIG, getAttackTarget, getAttackableWall } from '../domain/services/combatService';
import { Direction, WallType, WallState } from '../types';
import { aPlayer, anEnemy, aMap } from './builders';
import { createTestWall } from './testUtils';

describe('combat', () => {
  const testMap = aMap(7, 7).build();

  test('前方1タイルの敵にダメージを与えること', () => {
    const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
    const enemy = anEnemy().at(3, 2).build();

    const result = playerAttack(player, [enemy], testMap, 1000);
    expect(result.enemies[0].hp).toBe(enemy.hp - player.stats.attackPower);
  });

  test('範囲外の敵にはダメージが入らないこと', () => {
    const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
    const enemy = anEnemy().at(4, 2).build();

    const result = playerAttack(player, [enemy], testMap, 1000);
    expect(result.enemies[0].hp).toBe(enemy.hp);
  });

  describe('攻撃力の反映', () => {
    test('attackPowerステータスに応じたダメージを与えること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackPower: 5 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(3, 2).build();

      const result = playerAttack(player, [enemy], testMap, 1000);
      expect(result.enemies[0].hp).toBe(Math.max(0, enemy.hp - 5));
    });

    test('攻撃力1でも正しくダメージを与えること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackPower: 1 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(3, 2).build();

      const result = playerAttack(player, [enemy], testMap, 1000);
      expect(result.enemies[0].hp).toBe(enemy.hp - 1);
    });

    test('攻撃力に応じて敵を倒せること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackPower: 4 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(3, 2).build();

      const result = playerAttack(player, [enemy], testMap, 1000);
      expect(result.enemies[0].hp).toBe(0);
    });
  });

  describe('攻撃距離の反映', () => {
    test('attackRangeが2の場合、2マス先の敵を攻撃できること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackRange: 2 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(4, 2).build();

      const target = getAttackTarget(player, [enemy], testMap);
      expect(target).toBeDefined();
      expect(target?.id).toBe(enemy.id);
    });

    test('attackRangeが1の場合、2マス先の敵を攻撃できないこと', () => {
      const player = aPlayer().at(2, 2).withStats({ attackRange: 1 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(4, 2).build();

      const target = getAttackTarget(player, [enemy], testMap);
      expect(target).toBeUndefined();
    });

    test('攻撃距離内に壁がある場合、壁の向こうの敵は攻撃できないこと', () => {
      const map = aMap(7, 7).withWall(3, 2).build();
      const player = aPlayer().at(2, 2).withStats({ attackRange: 3 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(5, 2).build();

      const target = getAttackTarget(player, [enemy], map);
      expect(target).toBeUndefined();
    });

    test('攻撃距離内で最も近い敵を攻撃すること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackRange: 3 }).withDirection(Direction.RIGHT).build();
      const nearEnemy = anEnemy().withId('near').at(3, 2).build();
      const farEnemy = anEnemy().withId('far').at(5, 2).build();

      const target = getAttackTarget(player, [nearEnemy, farEnemy], testMap);
      expect(target?.id).toBe(nearEnemy.id);
    });
  });

  describe('攻撃速度の反映', () => {
    test('attackSpeedが0.5の場合、クールダウンが半分になること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackSpeed: 0.5 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(3, 2).build();

      const result = playerAttack(player, [enemy], testMap, 1000);
      expect(result.player.attackCooldownUntil).toBe(1000 + COMBAT_CONFIG.attackCooldown * 0.5);
    });

    test('attackSpeedが1.0の場合、標準のクールダウンになること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackSpeed: 1.0 }).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(3, 2).build();

      const result = playerAttack(player, [enemy], testMap, 1000);
      expect(result.player.attackCooldownUntil).toBe(1000 + COMBAT_CONFIG.attackCooldown);
    });
  });

  test('クールダウン中は攻撃できないこと', () => {
    const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
    const enemy = anEnemy().at(3, 2).build();

    const first = playerAttack(player, [enemy], testMap, 1000);
    const second = playerAttack(first.player, first.enemies, testMap, 1100);
    expect(second.didAttack).toBe(false);
  });

  test('接触時にダメージを受けること', () => {
    const player = aPlayer().at(2, 2).build();
    const enemy = anEnemy().at(2, 2).build();

    const result = processEnemyContact(player, [enemy], 1000);
    expect(result.player.hp).toBe(player.hp - enemy.damage);
  });

  test('無敵中は接触ダメージを受けないこと', () => {
    const player = aPlayer().at(2, 2).invincibleUntil(2000).build();
    const enemy = anEnemy().at(2, 2).build();

    const result = processEnemyContact(player, [enemy], 1500);
    expect(result.player.hp).toBe(player.hp);
  });

  test('ノックバックで1タイル移動すること', () => {
    const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
    const enemy = anEnemy().at(3, 2).build();

    const result = playerAttack(player, [enemy], testMap, 1000);
    const movedEnemy = result.enemies[0];
    expect(movedEnemy.x).toBe(4);
    expect(movedEnemy.y).toBe(2);
  });

  describe('破壊可能壁への攻撃', () => {
    test('敵がいない場合、破壊可能壁にダメージを与えること', () => {
      const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const result = playerAttack(player, [], testMap, 1000, [wall]);
      expect(result.hitWall).toBe(true);
      expect(result.walls).toBeDefined();
      expect(result.walls![0].hp).toBe(3 - player.stats.attackPower);
    });

    test('敵がいる場合は、壁より敵を優先して攻撃すること', () => {
      const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
      const enemy = anEnemy().at(3, 2).build();
      const wall = createTestWall(WallType.BREAKABLE, 4, 2, WallState.INTACT, 3);

      const result = playerAttack(player, [enemy], testMap, 1000, [wall]);
      expect(result.hitWall).toBeUndefined();
      expect(result.enemies[0].hp).toBeLessThan(enemy.hp);
      expect(result.walls![0].hp).toBe(3);
    });

    test('壊れた壁には攻撃しないこと', () => {
      const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.BROKEN, 0);

      const result = playerAttack(player, [], testMap, 1000, [wall]);
      expect(result.hitWall).toBeUndefined();
      expect(result.didAttack).toBe(true);
    });

    test('攻撃力が壁のHPを上回ると壁が壊れること', () => {
      const player = aPlayer().at(2, 2).withStats({ attackPower: 5 }).withDirection(Direction.RIGHT).build();
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const result = playerAttack(player, [], testMap, 1000, [wall]);
      expect(result.walls![0].hp).toBe(0);
      expect(result.walls![0].state).toBe(WallState.BROKEN);
    });

    test('getAttackableWallで破壊可能壁を取得できること', () => {
      const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const target = getAttackableWall(player, [wall], testMap);
      expect(target).toBeDefined();
      expect(target?.x).toBe(3);
      expect(target?.y).toBe(2);
    });

    test('通常壁は攻撃対象にならないこと', () => {
      const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
      const wall = createTestWall(WallType.NORMAL, 3, 2, WallState.INTACT);

      const target = getAttackableWall(player, [wall], testMap);
      expect(target).toBeUndefined();
    });

    test('壁タイル上の破壊可能壁も攻撃できること', () => {
      const map = aMap(7, 7).withWall(3, 2).build();
      const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const target = getAttackableWall(player, [wall], map);
      expect(target).toBeDefined();
      expect(target?.x).toBe(3);
      expect(target?.y).toBe(2);
    });

    test('壁タイル上の破壊可能壁にダメージを与えられること', () => {
      const map = aMap(7, 7).withWall(3, 2).build();
      const player = aPlayer().at(2, 2).withDirection(Direction.RIGHT).build();
      const wall = createTestWall(WallType.BREAKABLE, 3, 2, WallState.INTACT, 3);

      const result = playerAttack(player, [], map, 1000, [wall]);
      expect(result.hitWall).toBe(true);
      expect(result.walls).toBeDefined();
      expect(result.walls![0].hp).toBe(3 - player.stats.attackPower);
    });
  });
});
