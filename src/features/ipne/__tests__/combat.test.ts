import { playerAttack, processEnemyContact, COMBAT_CONFIG } from '../combat';
import { createTestEnemy, createTestMap, createTestPlayer } from './testUtils';
import { Direction, EnemyType } from '../types';

describe('combat', () => {
  test('前方1タイルの敵にダメージを与えること', () => {
    const map = createTestMap();
    const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
    const enemy = createTestEnemy(EnemyType.PATROL, 3, 2);

    const result = playerAttack(player, [enemy], map, 1000);
    expect(result.enemies[0].hp).toBe(enemy.hp - COMBAT_CONFIG.playerAttackDamage);
  });

  test('範囲外の敵にはダメージが入らないこと', () => {
    const map = createTestMap();
    const player = { ...createTestPlayer(2, 2), direction: Direction.RIGHT };
    const enemy = createTestEnemy(EnemyType.PATROL, 4, 2);

    const result = playerAttack(player, [enemy], map, 1000);
    expect(result.enemies[0].hp).toBe(enemy.hp);
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
});
