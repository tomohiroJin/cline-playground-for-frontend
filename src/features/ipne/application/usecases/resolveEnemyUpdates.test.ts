import { EnemyType } from '../../types';
import { createEnemy } from '../../domain/entities/enemy';
import { resolveEnemyUpdates } from './resolveEnemyUpdates';
import { MockIdGenerator } from '../../__tests__/mocks/MockIdGenerator';

const idGen = new MockIdGenerator();

describe('resolveEnemyUpdates', () => {
  it('生存中の敵はフィルタされない', () => {
    // Arrange
    const enemies = [
      createEnemy(EnemyType.PATROL, 1, 1, idGen),
      createEnemy(EnemyType.CHARGE, 2, 2, idGen),
    ];

    // Act
    const result = resolveEnemyUpdates(enemies, 1000);

    // Assert
    expect(result).toHaveLength(2);
  });

  it('HP0かつ isDying で死亡アニメーション中（300ms以内）は保持される', () => {
    // Arrange
    const dyingEnemy = {
      ...createEnemy(EnemyType.PATROL, 1, 1, idGen),
      hp: 0,
      isDying: true,
      deathStartTime: 900,
    };

    // Act
    const result = resolveEnemyUpdates([dyingEnemy], 1100);

    // Assert
    expect(result).toHaveLength(1);
  });

  it('HP0かつ isDying で死亡アニメーション完了（300ms以上）は除去される', () => {
    // Arrange
    const dyingEnemy = {
      ...createEnemy(EnemyType.PATROL, 1, 1, idGen),
      hp: 0,
      isDying: true,
      deathStartTime: 500,
    };

    // Act
    const result = resolveEnemyUpdates([dyingEnemy], 1000);

    // Assert
    expect(result).toHaveLength(0);
  });

  it('HP0かつ isDying でない敵は除去される', () => {
    // Arrange
    const deadEnemy = {
      ...createEnemy(EnemyType.PATROL, 1, 1, idGen),
      hp: 0,
      isDying: false,
    };

    // Act
    const result = resolveEnemyUpdates([deadEnemy], 1000);

    // Assert
    expect(result).toHaveLength(0);
  });
});
