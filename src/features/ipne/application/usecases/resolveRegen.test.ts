import { createPlayer } from '../../domain/entities/player';
import { resolveRegen, REGEN_CONFIG } from './resolveRegen';

describe('resolveRegen', () => {
  it('リジェネ間隔経過後にHPを1回復する', () => {
    // Arrange
    const player = { ...createPlayer(0, 0), hp: 10, maxHp: 20, lastRegenAt: 0 };
    const currentTime = REGEN_CONFIG.BASE_INTERVAL + 1;

    // Act
    const result = resolveRegen(player, currentTime);

    // Assert
    expect(result.hp).toBe(11);
    expect(result.lastRegenAt).toBe(currentTime);
  });

  it('リジェネ間隔未満の場合は回復しない', () => {
    // Arrange: healBonus=0 にして基本間隔で検証
    const player = {
      ...createPlayer(0, 0),
      hp: 10,
      maxHp: 20,
      lastRegenAt: 0,
      stats: { ...createPlayer(0, 0).stats, healBonus: 0 },
    };
    const currentTime = REGEN_CONFIG.BASE_INTERVAL - 1;

    // Act
    const result = resolveRegen(player, currentTime);

    // Assert
    expect(result.hp).toBe(10);
    expect(result.lastRegenAt).toBe(0);
  });

  it('HPが最大の場合は回復しない', () => {
    // Arrange
    const player = { ...createPlayer(0, 0), hp: 20, maxHp: 20, lastRegenAt: 0 };
    const currentTime = REGEN_CONFIG.BASE_INTERVAL + 1;

    // Act
    const result = resolveRegen(player, currentTime);

    // Assert
    expect(result.hp).toBe(20);
  });

  it('HPが0の場合は回復しない', () => {
    // Arrange
    const player = { ...createPlayer(0, 0), hp: 0, maxHp: 20, lastRegenAt: 0 };
    const currentTime = REGEN_CONFIG.BASE_INTERVAL + 1;

    // Act
    const result = resolveRegen(player, currentTime);

    // Assert
    expect(result.hp).toBe(0);
  });

  it('healBonus により回復間隔が短縮される', () => {
    // Arrange
    const player = {
      ...createPlayer(0, 0),
      hp: 10,
      maxHp: 20,
      lastRegenAt: 0,
      stats: { ...createPlayer(0, 0).stats, healBonus: 3 },
    };
    // healBonus 3 → 12000 - 3*1000 = 9000ms
    const currentTime = 9001;

    // Act
    const result = resolveRegen(player, currentTime);

    // Assert
    expect(result.hp).toBe(11);
  });

  it('healBonus で短縮しても最短間隔（5秒）を下回らない', () => {
    // Arrange
    const player = {
      ...createPlayer(0, 0),
      hp: 10,
      maxHp: 20,
      lastRegenAt: 0,
      stats: { ...createPlayer(0, 0).stats, healBonus: 20 },
    };
    // healBonus 20 でも最短 5000ms
    const currentTime = 4999;

    // Act
    const result = resolveRegen(player, currentTime);

    // Assert
    expect(result.hp).toBe(10);
  });

  it('HPが最大HPを超えない', () => {
    // Arrange
    const player = { ...createPlayer(0, 0), hp: 19, maxHp: 20, lastRegenAt: 0 };
    const currentTime = REGEN_CONFIG.BASE_INTERVAL + 1;

    // Act
    const result = resolveRegen(player, currentTime);

    // Assert
    expect(result.hp).toBe(20);
  });
});
