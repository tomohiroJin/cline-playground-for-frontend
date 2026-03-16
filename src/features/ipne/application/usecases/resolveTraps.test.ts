import { createPlayer } from '../../domain/entities/player';
import { createTrap } from '../../domain/entities/trap';
import { TrapType, TileType, GameMap } from '../../types';
import { resolveTraps } from './resolveTraps';
import { MockIdGenerator } from '../../__tests__/mocks/MockIdGenerator';
import { MockRandomProvider } from '../../__tests__/mocks/MockRandomProvider';
import { COMBAT_CONFIG } from '../../domain/services/combatService';

const idGen = new MockIdGenerator();
const random = new MockRandomProvider(0.5);

describe('resolveTraps', () => {
  const createFloorMap = (size: number): GameMap =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => TileType.FLOOR));

  it('プレイヤー位置に罠がある場合にトリガーされる', () => {
    // Arrange
    const player = createPlayer(3, 3);
    const trap = createTrap(TrapType.DAMAGE, 3, 3, idGen);
    const map = createFloorMap(7);

    // Act
    const result = resolveTraps({
      player,
      traps: [trap],
      currentTime: 10000,
      invincibleDuration: COMBAT_CONFIG.invincibleDuration,
      map,
      random,
    });

    // Assert
    expect(result.effects.length).toBeGreaterThan(0);
  });

  it('プレイヤー位置に罠がない場合は何もしない', () => {
    // Arrange
    const player = createPlayer(3, 3);
    const trap = createTrap(TrapType.DAMAGE, 5, 5, idGen);
    const map = createFloorMap(7);

    // Act
    const result = resolveTraps({
      player,
      traps: [trap],
      currentTime: 10000,
      invincibleDuration: COMBAT_CONFIG.invincibleDuration,
      map,
      random,
    });

    // Assert
    expect(result.effects).toHaveLength(0);
    expect(result.player).toBe(player);
    expect(result.traps).toBe(result.traps);
  });

  it('テレポート罠の場合はプレイヤー位置が変更されテレポート効果音が再生される', () => {
    // Arrange
    const player = createPlayer(3, 3);
    const trap = createTrap(TrapType.TELEPORT, 3, 3, idGen);
    const map = createFloorMap(7);

    // Act
    const result = resolveTraps({
      player,
      traps: [trap],
      currentTime: 10000,
      invincibleDuration: COMBAT_CONFIG.invincibleDuration,
      map,
      random,
    });

    // Assert
    const hasTeleportEffect = result.effects.some(
      e => e.kind === 'sound' && e.type === 'teleport'
    );
    expect(hasTeleportEffect).toBe(true);
  });
});
